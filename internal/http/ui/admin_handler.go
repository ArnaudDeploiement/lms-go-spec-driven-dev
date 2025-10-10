package ui

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"lms-go/internal/content"
	"lms-go/internal/course"
	"lms-go/internal/enrollment"
	"lms-go/internal/ent"
	"lms-go/internal/organization"
	"lms-go/internal/user"
)

var defaultUserRoles = []string{"admin", "designer", "tutor", "learner"}

type AdminHandler struct {
	orgService        *organization.Service
	userService       *user.Service
	courseService     *course.Service
	contentService    *content.Service
	enrollmentService *enrollment.Service
}

func NewAdminHandler(orgSvc *organization.Service, userSvc *user.Service, courseSvc *course.Service, contentSvc *content.Service, enrollmentSvc *enrollment.Service) *AdminHandler {
	return &AdminHandler{
		orgService:        orgSvc,
		userService:       userSvc,
		courseService:     courseSvc,
		contentService:    contentSvc,
		enrollmentService: enrollmentSvc,
	}
}

func (h *AdminHandler) Mount(r chi.Router) {
	r.Get("/", h.dashboard)
	r.Get("/courses", h.coursesPage)
	r.Get("/courses/new", h.courseWizardPage)
	r.Get("/contents", h.contentsPage)
	r.Get("/contents/v2", h.contentsPageV2)

	// Organization endpoints
	r.Post("/organizations", h.createOrganization)

	// User endpoints
	r.Post("/users", h.createUser)

	// Course endpoints
	r.Post("/courses", h.createCourse)
	r.Post("/courses/wizard", h.createCourseWizard)
	r.Post("/courses/{courseID}/publish", h.publishCourse)
	r.Post("/courses/{courseID}/unpublish", h.unpublishCourse)
	r.Post("/courses/{courseID}/update", h.updateCourse)
	r.Post("/courses/{courseID}/delete", h.deleteCourse)

	// Module endpoints
	r.Post("/modules", h.createModule)
	r.Post("/modules/{moduleID}/update", h.updateModule)
	r.Post("/modules/{moduleID}/delete", h.deleteModule)

	// Content endpoints
	r.Post("/contents", h.createContent)
	r.Post("/contents/upload", h.createContentUpload)
	r.Post("/contents/{contentID}/delete", h.deleteContent)
}

type adminCourse struct {
	Course          *ent.Course
	Modules         []*ent.Module
	EnrollmentCount int
}

type adminViewModel struct {
	Page          string
	PageTitle     string
	FlashMessage  string
	FlashError    string
	UploadURL     string
	CurrentYear   int
	Organizations []*ent.Organization
	SelectedOrg   uuid.UUID
	Users         []*ent.User
	Courses       []adminCourse
	Contents      []*ent.Content
	ModuleTypes   []string
	UserRoles     []string
}

func (h *AdminHandler) dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	orgs, err := h.orgService.List(ctx, "")
	if err != nil {
		http.Error(w, "unable to list organizations", http.StatusInternalServerError)
		return
	}

	var selected uuid.UUID
	if orgParam := strings.TrimSpace(r.URL.Query().Get("org")); orgParam != "" {
		parsed, err := uuid.Parse(orgParam)
		if err == nil {
			selected = parsed
		}
	}
	if selected == uuid.Nil && len(orgs) > 0 {
		selected = orgs[0].ID
	}

	vm := adminViewModel{
		Page:          "admin",
		PageTitle:     "Administration - LMS Go",
		FlashMessage:  r.URL.Query().Get("msg"),
		FlashError:    r.URL.Query().Get("err"),
		UploadURL:     r.URL.Query().Get("upload_url"),
		Organizations: orgs,
		SelectedOrg:   selected,
		CurrentYear:   time.Now().Year(),
		ModuleTypes:   course.AllowedModuleTypes(),
		UserRoles:     append([]string(nil), defaultUserRoles...),
	}

	if selected != uuid.Nil {
		users, err := h.userService.List(ctx, selected, user.Filter{})
		if err != nil {
			http.Error(w, "unable to list users", http.StatusInternalServerError)
			return
		}
		vm.Users = users

		courses, err := h.courseService.List(ctx, selected, course.CourseFilter{})
		if err != nil {
			http.Error(w, "unable to list courses", http.StatusInternalServerError)
			return
		}
		courseStates := make([]adminCourse, 0, len(courses))
		for _, c := range courses {
			mods, err := h.courseService.ListModules(ctx, selected, c.ID)
			if err != nil {
				http.Error(w, "unable to list modules", http.StatusInternalServerError)
				return
			}
			var enrollmentCount int
			if h.enrollmentService != nil {
				enrollments, err := h.enrollmentService.List(ctx, selected, enrollment.EnrollmentFilter{CourseID: c.ID})
				if err != nil {
					http.Error(w, "unable to list enrollments", http.StatusInternalServerError)
					return
				}
				enrollmentCount = len(enrollments)
			}
			courseStates = append(courseStates, adminCourse{
				Course:          c,
				Modules:         mods,
				EnrollmentCount: enrollmentCount,
			})
		}
		vm.Courses = courseStates

		contents, err := h.contentService.List(ctx, selected)
		if err != nil {
			http.Error(w, "unable to list contents", http.StatusInternalServerError)
			return
		}
		vm.Contents = contents
	}

	if err := adminTemplates.ExecuteTemplate(w, "admin", vm); err != nil {
		http.Error(w, "template rendering error", http.StatusInternalServerError)
	}
}

func (h *AdminHandler) createOrganization(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.redirect(w, r, uuid.Nil, "", "formulaire invalide", nil)
		return
	}
	name := strings.TrimSpace(r.FormValue("name"))
	slug := strings.TrimSpace(r.FormValue("slug"))
	org, err := h.orgService.Create(r.Context(), organization.CreateInput{Name: name, Slug: slug})
	if err != nil {
		log.Printf("admin: create organization: %v", err)
		h.redirect(w, r, uuid.Nil, "", friendlyError(err), nil)
		return
	}
	h.redirect(w, r, org.ID, "Organisation créée", "", nil)
}

func (h *AdminHandler) createUser(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.redirect(w, r, uuid.Nil, "", "formulaire invalide", nil)
		return
	}
	orgID, err := uuid.Parse(r.FormValue("org_id"))
	if err != nil {
		h.redirect(w, r, uuid.Nil, "", "Organisation invalide", nil)
		return
	}
	input := user.CreateInput{
		OrganizationID: orgID,
		Email:          strings.TrimSpace(r.FormValue("email")),
		Password:       r.FormValue("password"),
		Role:           strings.TrimSpace(r.FormValue("role")),
	}
	if _, err := h.userService.Create(r.Context(), input); err != nil {
		log.Printf("admin: create user: %v", err)
		h.redirect(w, r, orgID, "", friendlyError(err), nil)
		return
	}
	h.redirect(w, r, orgID, "Utilisateur créé", "", nil)
}

func (h *AdminHandler) createCourse(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.redirect(w, r, uuid.Nil, "", "formulaire invalide", nil)
		return
	}
	orgID, err := uuid.Parse(r.FormValue("org_id"))
	if err != nil {
		h.redirect(w, r, uuid.Nil, "", "Organisation invalide", nil)
		return
	}
	input := course.CreateCourseInput{
		OrganizationID: orgID,
		Title:          strings.TrimSpace(r.FormValue("title")),
		Slug:           strings.TrimSpace(r.FormValue("slug")),
		Description:    strings.TrimSpace(r.FormValue("description")),
	}
	if _, err := h.courseService.Create(r.Context(), input); err != nil {
		log.Printf("admin: create course: %v", err)
		h.redirect(w, r, orgID, "", friendlyError(err), nil)
		return
	}
	h.redirect(w, r, orgID, "Cours créé", "", nil)
}

func (h *AdminHandler) createModule(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.redirect(w, r, uuid.Nil, "", "formulaire invalide", nil)
		return
	}
	orgID, err := uuid.Parse(r.FormValue("org_id"))
	if err != nil {
		h.redirect(w, r, uuid.Nil, "", "Organisation invalide", nil)
		return
	}
	courseID, err := uuid.Parse(r.FormValue("course_id"))
	if err != nil {
		h.redirect(w, r, orgID, "", "Cours invalide", nil)
		return
	}
	var contentID *uuid.UUID
	if val := strings.TrimSpace(r.FormValue("content_id")); val != "" {
		parsed, err := uuid.Parse(val)
		if err != nil {
			h.redirect(w, r, orgID, "", "Contenu invalide", nil)
			return
		}
		contentID = &parsed
	}
	duration := 0
	if val := strings.TrimSpace(r.FormValue("duration")); val != "" {
		if d, err := strconv.Atoi(val); err == nil {
			duration = d
		}
	}
	_, err = h.courseService.AddModule(r.Context(), orgID, courseID, course.ModuleInput{
		Title:        strings.TrimSpace(r.FormValue("title")),
		ModuleType:   strings.TrimSpace(r.FormValue("module_type")),
		ContentID:    contentID,
		DurationSecs: duration,
	})
	if err != nil {
		log.Printf("admin: create module: %v", err)
		h.redirect(w, r, orgID, "", friendlyError(err), nil)
		return
	}
	h.redirect(w, r, orgID, "Module ajouté", "", nil)
}

func (h *AdminHandler) createContent(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.redirect(w, r, uuid.Nil, "", "formulaire invalide", nil)
		return
	}
	orgID, err := uuid.Parse(r.FormValue("org_id"))
	if err != nil {
		h.redirect(w, r, uuid.Nil, "", "Organisation invalide", nil)
		return
	}
	size := int64(0)
	if val := strings.TrimSpace(r.FormValue("size_bytes")); val != "" {
		parsed, err := strconv.ParseInt(val, 10, 64)
		if err != nil {
			h.redirect(w, r, orgID, "", "Taille invalide", nil)
			return
		}
		size = parsed
	}
	link, err := h.contentService.CreateUpload(r.Context(), content.CreateUploadInput{
		OrganizationID: orgID,
		Name:           strings.TrimSpace(r.FormValue("name")),
		MimeType:       strings.TrimSpace(r.FormValue("mime_type")),
		SizeBytes:      size,
		Metadata:       map[string]any{},
	})
	if err != nil {
		log.Printf("admin: create content: %v", err)
		h.redirect(w, r, orgID, "", friendlyError(err), nil)
		return
	}
	extras := url.Values{}
	extras.Set("upload_url", link.UploadURL)
	h.redirect(w, r, orgID, fmt.Sprintf("Contenu %s prêt à être uploadé", link.Content.Name), "", extras)
}

func (h *AdminHandler) redirect(w http.ResponseWriter, r *http.Request, orgID uuid.UUID, msg string, errMsg string, extras url.Values) {
	q := url.Values{}
	if orgID != uuid.Nil {
		q.Set("org", orgID.String())
	}
	if msg != "" {
		q.Set("msg", msg)
	}
	if errMsg != "" {
		q.Set("err", errMsg)
	}
	for key, values := range extras {
		for _, v := range values {
			q.Add(key, v)
		}
	}
	target := "/admin"
	if encoded := q.Encode(); encoded != "" {
		target = target + "?" + encoded
	}
	http.Redirect(w, r, target, http.StatusSeeOther)
}

func (h *AdminHandler) coursesPage(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	orgID, err := h.getOrgID(r)
	if err != nil {
		http.Error(w, "Organisation invalide", http.StatusBadRequest)
		return
	}

	courses, err := h.courseService.List(ctx, orgID, course.CourseFilter{})
	if err != nil {
		http.Error(w, "unable to list courses", http.StatusInternalServerError)
		return
	}

	courseStates := make([]adminCourse, 0, len(courses))
	for _, c := range courses {
		mods, err := h.courseService.ListModules(ctx, orgID, c.ID)
		if err != nil {
			http.Error(w, "unable to list modules", http.StatusInternalServerError)
			return
		}
		var enrollmentCount int
		if h.enrollmentService != nil {
			enrollments, err := h.enrollmentService.List(ctx, orgID, enrollment.EnrollmentFilter{CourseID: c.ID})
			if err != nil {
				http.Error(w, "unable to list enrollments", http.StatusInternalServerError)
				return
			}
			enrollmentCount = len(enrollments)
		}
		courseStates = append(courseStates, adminCourse{
			Course:          c,
			Modules:         mods,
			EnrollmentCount: enrollmentCount,
		})
	}

	contents, err := h.contentService.List(ctx, orgID)
	if err != nil {
		http.Error(w, "unable to list contents", http.StatusInternalServerError)
		return
	}

	vm := adminViewModel{
		Page:         "admin-courses",
		PageTitle:    "Gestion des cours - LMS Go",
		FlashMessage: r.URL.Query().Get("msg"),
		FlashError:   r.URL.Query().Get("err"),
		SelectedOrg:  orgID,
		Courses:      courseStates,
		Contents:     contents,
		ModuleTypes:  course.AllowedModuleTypes(),
		CurrentYear:  time.Now().Year(),
	}

	if err := coursesTemplates.ExecuteTemplate(w, "admin-courses", vm); err != nil {
		http.Error(w, "template rendering error", http.StatusInternalServerError)
	}
}

func (h *AdminHandler) contentsPage(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	orgID, err := h.getOrgID(r)
	if err != nil {
		http.Error(w, "Organisation invalide", http.StatusBadRequest)
		return
	}

	contents, err := h.contentService.List(ctx, orgID)
	if err != nil {
		http.Error(w, "unable to list contents", http.StatusInternalServerError)
		return
	}

	vm := adminViewModel{
		Page:         "admin-contents",
		PageTitle:    "Bibliothèque de contenus - LMS Go",
		FlashMessage: r.URL.Query().Get("msg"),
		FlashError:   r.URL.Query().Get("err"),
		UploadURL:    r.URL.Query().Get("upload_url"),
		SelectedOrg:  orgID,
		Contents:     contents,
		CurrentYear:  time.Now().Year(),
	}

	if err := contentsTemplates.ExecuteTemplate(w, "admin-contents", vm); err != nil {
		http.Error(w, "template rendering error", http.StatusInternalServerError)
	}
}

func (h *AdminHandler) publishCourse(w http.ResponseWriter, r *http.Request) {
	orgID, err := h.getOrgID(r)
	if err != nil {
		h.redirectToCourses(w, r, orgID, "", "Organisation invalide")
		return
	}
	courseID, err := uuid.Parse(chi.URLParam(r, "courseID"))
	if err != nil {
		h.redirectToCourses(w, r, orgID, "", "Cours invalide")
		return
	}
	if _, err := h.courseService.Publish(r.Context(), orgID, courseID); err != nil {
		log.Printf("admin: publish course: %v", err)
		h.redirectToCourses(w, r, orgID, "", friendlyError(err))
		return
	}
	h.redirectToCourses(w, r, orgID, "Cours publié avec succès", "")
}

func (h *AdminHandler) unpublishCourse(w http.ResponseWriter, r *http.Request) {
	orgID, err := h.getOrgID(r)
	if err != nil {
		h.redirectToCourses(w, r, orgID, "", "Organisation invalide")
		return
	}
	courseID, err := uuid.Parse(chi.URLParam(r, "courseID"))
	if err != nil {
		h.redirectToCourses(w, r, orgID, "", "Cours invalide")
		return
	}
	if _, err := h.courseService.Unpublish(r.Context(), orgID, courseID); err != nil {
		log.Printf("admin: unpublish course: %v", err)
		h.redirectToCourses(w, r, orgID, "", friendlyError(err))
		return
	}
	h.redirectToCourses(w, r, orgID, "Cours dépublié avec succès", "")
}

func (h *AdminHandler) updateCourse(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.redirect(w, r, uuid.Nil, "", "formulaire invalide", nil)
		return
	}
	orgID, err := h.getOrgID(r)
	if err != nil {
		h.redirectToCourses(w, r, orgID, "", "Organisation invalide")
		return
	}
	courseID, err := uuid.Parse(chi.URLParam(r, "courseID"))
	if err != nil {
		h.redirectToCourses(w, r, orgID, "", "Cours invalide")
		return
	}

	title := strings.TrimSpace(r.FormValue("title"))
	description := strings.TrimSpace(r.FormValue("description"))

	input := course.UpdateCourseInput{
		Title:       &title,
		Description: &description,
	}
	if _, err := h.courseService.Update(r.Context(), orgID, courseID, input); err != nil {
		log.Printf("admin: update course: %v", err)
		h.redirectToCourses(w, r, orgID, "", friendlyError(err))
		return
	}
	h.redirectToCourses(w, r, orgID, "Cours modifié avec succès", "")
}

func (h *AdminHandler) deleteCourse(w http.ResponseWriter, r *http.Request) {
	orgID, err := h.getOrgID(r)
	if err != nil {
		h.redirectToCourses(w, r, orgID, "", "Organisation invalide")
		return
	}
	courseID, err := uuid.Parse(chi.URLParam(r, "courseID"))
	if err != nil {
		h.redirectToCourses(w, r, orgID, "", "Cours invalide")
		return
	}

	if err := h.courseService.Delete(r.Context(), orgID, courseID); err != nil {
		log.Printf("admin: delete course: %v", err)
		h.redirectToCourses(w, r, orgID, "", friendlyError(err))
		return
	}
	h.redirectToCourses(w, r, orgID, "Cours supprimé avec succès", "")
}

func (h *AdminHandler) updateModule(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.redirect(w, r, uuid.Nil, "", "formulaire invalide", nil)
		return
	}
	orgID, err := h.getOrgID(r)
	if err != nil {
		h.redirectToCourses(w, r, orgID, "", "Organisation invalide")
		return
	}
	moduleID, err := uuid.Parse(chi.URLParam(r, "moduleID"))
	if err != nil {
		h.redirectToCourses(w, r, orgID, "", "Module invalide")
		return
	}

	var contentID *uuid.UUID
	if val := strings.TrimSpace(r.FormValue("content_id")); val != "" {
		parsed, err := uuid.Parse(val)
		if err != nil {
			h.redirectToCourses(w, r, orgID, "", "Contenu invalide")
			return
		}
		contentID = &parsed
	}

	duration := 0
	if val := strings.TrimSpace(r.FormValue("duration")); val != "" {
		if d, err := strconv.Atoi(val); err == nil {
			duration = d
		}
	}

	input := course.ModuleInput{
		Title:        strings.TrimSpace(r.FormValue("title")),
		ModuleType:   strings.TrimSpace(r.FormValue("module_type")),
		ContentID:    contentID,
		DurationSecs: duration,
	}

	if _, err := h.courseService.UpdateModule(r.Context(), orgID, moduleID, input); err != nil {
		log.Printf("admin: update module: %v", err)
		h.redirectToCourses(w, r, orgID, "", friendlyError(err))
		return
	}
	h.redirectToCourses(w, r, orgID, "Module modifié avec succès", "")
}

func (h *AdminHandler) deleteModule(w http.ResponseWriter, r *http.Request) {
	orgID, err := h.getOrgID(r)
	if err != nil {
		h.redirectToCourses(w, r, orgID, "", "Organisation invalide")
		return
	}
	moduleID, err := uuid.Parse(chi.URLParam(r, "moduleID"))
	if err != nil {
		h.redirectToCourses(w, r, orgID, "", "Module invalide")
		return
	}

	if err := h.courseService.RemoveModule(r.Context(), orgID, moduleID); err != nil {
		log.Printf("admin: delete module: %v", err)
		h.redirectToCourses(w, r, orgID, "", friendlyError(err))
		return
	}
	h.redirectToCourses(w, r, orgID, "Module supprimé avec succès", "")
}

func (h *AdminHandler) deleteContent(w http.ResponseWriter, r *http.Request) {
	orgID, err := h.getOrgID(r)
	if err != nil {
		h.redirectToContents(w, r, orgID, "", "Organisation invalide")
		return
	}
	contentID, err := uuid.Parse(chi.URLParam(r, "contentID"))
	if err != nil {
		h.redirectToContents(w, r, orgID, "", "Contenu invalide")
		return
	}

	if err := h.contentService.Archive(r.Context(), orgID, contentID); err != nil {
		log.Printf("admin: delete content: %v", err)
		h.redirectToContents(w, r, orgID, "", "Impossible de supprimer le contenu")
		return
	}
	h.redirectToContents(w, r, orgID, "Contenu supprimé avec succès", "")
}

func (h *AdminHandler) getOrgID(r *http.Request) (uuid.UUID, error) {
	orgParam := strings.TrimSpace(r.URL.Query().Get("org"))
	if orgParam == "" {
		orgParam = strings.TrimSpace(r.FormValue("org_id"))
	}
	if orgParam == "" {
		return uuid.Nil, errors.New("org parameter missing")
	}
	return uuid.Parse(orgParam)
}

func (h *AdminHandler) redirectToCourses(w http.ResponseWriter, r *http.Request, orgID uuid.UUID, msg string, errMsg string) {
	q := url.Values{}
	if orgID != uuid.Nil {
		q.Set("org", orgID.String())
	}
	if msg != "" {
		q.Set("msg", msg)
	}
	if errMsg != "" {
		q.Set("err", errMsg)
	}
	target := "/admin/courses"
	if encoded := q.Encode(); encoded != "" {
		target = target + "?" + encoded
	}
	http.Redirect(w, r, target, http.StatusSeeOther)
}

func (h *AdminHandler) redirectToContents(w http.ResponseWriter, r *http.Request, orgID uuid.UUID, msg string, errMsg string) {
	q := url.Values{}
	if orgID != uuid.Nil {
		q.Set("org", orgID.String())
	}
	if msg != "" {
		q.Set("msg", msg)
	}
	if errMsg != "" {
		q.Set("err", errMsg)
	}
	target := "/admin/contents"
	if encoded := q.Encode(); encoded != "" {
		target = target + "?" + encoded
	}
	http.Redirect(w, r, target, http.StatusSeeOther)
}

func friendlyError(err error) string {
	switch {
	case errors.Is(err, organization.ErrInvalidInput):
		return "Veuillez vérifier les informations de l'organisation."
	case errors.Is(err, organization.ErrSlugAlreadyUsed):
		return "Ce slug est déjà utilisé pour une autre organisation."
	case errors.Is(err, user.ErrInvalidInput):
		return "Les informations utilisateur sont incomplètes ou invalides."
	case errors.Is(err, user.ErrEmailAlreadyUsed):
		return "Cette adresse email est déjà utilisée."
	case errors.Is(err, course.ErrInvalidInput):
		return "Les informations du cours ou du module sont invalides."
	case errors.Is(err, course.ErrSlugTaken):
		return "Ce slug de cours est déjà utilisé."
	case errors.Is(err, content.ErrInvalidInput):
		return "Les informations du contenu sont invalides."
	case errors.Is(err, enrollment.ErrInvalidInput):
		return "Les informations d'inscription sont invalides."
	case errors.Is(err, enrollment.ErrAlreadyEnrolled):
		return "L'utilisateur est déjà inscrit à ce cours."
	default:
		return "Une erreur est survenue. Merci de réessayer."
	}
}

// courseWizardPage renders the course creation wizard
func (h *AdminHandler) courseWizardPage(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	orgID, err := h.getOrgID(r)
	if err != nil {
		http.Error(w, "Organisation invalide", http.StatusBadRequest)
		return
	}

	contents, err := h.contentService.List(ctx, orgID)
	if err != nil {
		http.Error(w, "unable to list contents", http.StatusInternalServerError)
		return
	}

	vm := adminViewModel{
		Page:        "admin-course-wizard",
		PageTitle:   "Créer un cours - LMS Go",
		SelectedOrg: orgID,
		Contents:    contents,
		ModuleTypes: course.AllowedModuleTypes(),
		CurrentYear: time.Now().Year(),
	}

	if err := wizardTemplates.ExecuteTemplate(w, "admin-course-wizard", vm); err != nil {
		log.Printf("template error: %v", err)
		http.Error(w, "template rendering error", http.StatusInternalServerError)
	}
}

// createCourseWizard handles the wizard-based course creation with modules
func (h *AdminHandler) createCourseWizard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Parse JSON body
	var req struct {
		OrgID       string `json:"org_id"`
		Title       string `json:"title"`
		Description string `json:"description"`
		Slug        string `json:"slug"`
		AutoPublish bool   `json:"auto_publish"`
		Modules     []struct {
			Title        string     `json:"title"`
			ModuleType   string     `json:"module_type"`
			ContentID    *uuid.UUID `json:"content_id"`
			DurationSecs int        `json:"duration_secs"`
			Position     int        `json:"position"`
		} `json:"modules"`
	}

	if err := r.ParseForm(); err == nil && r.Header.Get("Content-Type") != "application/json" {
		// Handle form submission (fallback)
		orgID, _ := uuid.Parse(r.FormValue("org_id"))
		req.OrgID = orgID.String()
		req.Title = r.FormValue("title")
		req.Description = r.FormValue("description")
		req.Slug = r.FormValue("slug")
	} else {
		// Handle JSON submission
		if err := r.ParseForm(); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprintf(w, `{"error": "Invalid request"}`)
			return
		}
		decoder := r.Body
		if err := json.NewDecoder(decoder).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprintf(w, `{"error": "Invalid JSON: %s"}`, err.Error())
			return
		}
	}

	orgID, err := uuid.Parse(req.OrgID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, `{"error": "Invalid organization ID"}`)
		return
	}

	// Create the course
	courseInput := course.CreateCourseInput{
		OrganizationID: orgID,
		Title:          req.Title,
		Slug:           req.Slug,
		Description:    req.Description,
	}

	newCourse, err := h.courseService.Create(ctx, courseInput)
	if err != nil {
		log.Printf("wizard: create course: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, `{"error": "%s"}`, friendlyError(err))
		return
	}

	// Add modules
	for _, mod := range req.Modules {
		moduleInput := course.ModuleInput{
			Title:        mod.Title,
			ModuleType:   mod.ModuleType,
			ContentID:    mod.ContentID,
			DurationSecs: mod.DurationSecs,
		}
		if _, err := h.courseService.AddModule(ctx, orgID, newCourse.ID, moduleInput); err != nil {
			log.Printf("wizard: add module: %v", err)
			// Continue adding other modules even if one fails
		}
	}

	// Auto-publish if requested
	if req.AutoPublish {
		if _, err := h.courseService.Publish(ctx, orgID, newCourse.ID); err != nil {
			log.Printf("wizard: auto-publish: %v", err)
		}
	}

	// Return success
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"success": true, "course_id": "%s"}`, newCourse.ID)
}

// contentsPageV2 renders the improved contents management page
func (h *AdminHandler) contentsPageV2(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	orgID, err := h.getOrgID(r)
	if err != nil {
		http.Error(w, "Organisation invalide", http.StatusBadRequest)
		return
	}

	contents, err := h.contentService.List(ctx, orgID)
	if err != nil {
		http.Error(w, "unable to list contents", http.StatusInternalServerError)
		return
	}

	vm := adminViewModel{
		Page:         "admin-contents-v2",
		PageTitle:    "Bibliothèque de contenus - LMS Go",
		FlashMessage: r.URL.Query().Get("msg"),
		FlashError:   r.URL.Query().Get("err"),
		UploadURL:    r.URL.Query().Get("upload_url"),
		SelectedOrg:  orgID,
		Contents:     contents,
		CurrentYear:  time.Now().Year(),
	}

	if err := contentsV2Templates.ExecuteTemplate(w, "admin-contents-v2", vm); err != nil {
		log.Printf("template error: %v", err)
		http.Error(w, "template rendering error", http.StatusInternalServerError)
	}
}

// createContentUpload handles direct file upload with JSON API
func (h *AdminHandler) createContentUpload(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		OrgID     string `json:"org_id"`
		Name      string `json:"name"`
		MimeType  string `json:"mime_type"`
		SizeBytes int64  `json:"size_bytes"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, `{"error": "Invalid JSON"}`)
		return
	}

	orgID, err := uuid.Parse(req.OrgID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, `{"error": "Invalid organization ID"}`)
		return
	}

	link, err := h.contentService.CreateUpload(ctx, content.CreateUploadInput{
		OrganizationID: orgID,
		Name:           req.Name,
		MimeType:       req.MimeType,
		SizeBytes:      req.SizeBytes,
		Metadata:       map[string]any{},
	})

	if err != nil {
		log.Printf("upload: create content: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, `{"error": "%s"}`, friendlyError(err))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"success": true, "upload_url": "%s", "content_id": "%s"}`, link.UploadURL, link.Content.ID)
}
