package ui

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"lms-go/internal/content"
	"lms-go/internal/course"
	"lms-go/internal/enrollment"
	"lms-go/internal/ent"
	"lms-go/internal/organization"
	"lms-go/internal/progress"
	"lms-go/internal/user"
)

type LearnerHandler struct {
	orgService        *organization.Service
	userService       *user.Service
	courseService     *course.Service
	contentService    *content.Service
	enrollmentService *enrollment.Service
	progressService   *progress.Service
}

func NewLearnerHandler(orgSvc *organization.Service, userSvc *user.Service, courseSvc *course.Service, contentSvc *content.Service, enrollmentSvc *enrollment.Service, progressSvc *progress.Service) *LearnerHandler {
	return &LearnerHandler{
		orgService:        orgSvc,
		userService:       userSvc,
		courseService:     courseSvc,
		contentService:    contentSvc,
		enrollmentService: enrollmentSvc,
		progressService:   progressSvc,
	}
}

func (h *LearnerHandler) Mount(r chi.Router) {
	r.Get("/", h.catalog)
	r.Get("/courses/{courseID}", h.courseDetail)
}

type learnerCourseCard struct {
	Course        *ent.Course
	Enrollment    *ent.Enrollment
	ProgressLabel string
	ModuleCount   int
	NextModule    string
}

type learnerCatalogViewModel struct {
	Page            string
	PageTitle       string
	FlashMessage    string
	FlashError      string
	CurrentYear     int
	Organizations   []*ent.Organization
	Learners        []*ent.User
	SelectedOrg     uuid.UUID
	SelectedLearner uuid.UUID
	Courses         []learnerCourseCard
}

func (h *LearnerHandler) catalog(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	orgs, err := h.orgService.List(ctx, "")
	if err != nil {
		http.Error(w, "unable to list organizations", http.StatusInternalServerError)
		return
	}
	selectedOrg := selectUUIDParam(r, "org")
	if selectedOrg == uuid.Nil && len(orgs) > 0 {
		selectedOrg = orgs[0].ID
	}

	var learners []*ent.User
	if selectedOrg != uuid.Nil {
		users, err := h.userService.List(ctx, selectedOrg, user.Filter{})
		if err != nil {
			http.Error(w, "unable to list users", http.StatusInternalServerError)
			return
		}
		for _, u := range users {
			if strings.ToLower(u.Role) == "learner" {
				learners = append(learners, u)
			}
		}
	}
	selectedLearner := selectUUIDParam(r, "user")
	if selectedLearner == uuid.Nil && len(learners) > 0 {
		selectedLearner = learners[0].ID
	}

	vm := learnerCatalogViewModel{
		Page:            "learn",
		PageTitle:       "Catalogue apprenant - LMS Go",
		CurrentYear:     time.Now().Year(),
		Organizations:   orgs,
		Learners:        learners,
		SelectedOrg:     selectedOrg,
		SelectedLearner: selectedLearner,
	}

	if selectedOrg != uuid.Nil {
		courses, err := h.courseService.List(ctx, selectedOrg, course.CourseFilter{Status: course.StatusPublished})
		if err != nil {
			http.Error(w, "unable to list courses", http.StatusInternalServerError)
			return
		}
		sort.Slice(courses, func(i, j int) bool {
			return courses[i].CreatedAt.After(courses[j].CreatedAt)
		})

		cards := make([]learnerCourseCard, 0, len(courses))
		for _, c := range courses {
			var enrollmentEntity *ent.Enrollment
			if selectedLearner != uuid.Nil {
				list, err := h.enrollmentService.List(ctx, selectedOrg, enrollment.EnrollmentFilter{
					CourseID: c.ID,
					UserID:   selectedLearner,
				})
				if err != nil {
					http.Error(w, "unable to load enrollments", http.StatusInternalServerError)
					return
				}
				if len(list) > 0 {
					enrollmentEntity = list[0]
				}
			}

			modules, err := h.courseService.ListModules(ctx, selectedOrg, c.ID)
			if err != nil {
				http.Error(w, "unable to list modules", http.StatusInternalServerError)
				return
			}
			nextModule := ""
			if len(modules) > 0 {
				nextModule = modules[0].Title
			}

			progressLabel := "Non inscrit"
			if enrollmentEntity != nil {
				progressLabel = fmt.Sprintf("%.0f%% complété", enrollmentEntity.Progress)
				if enrollmentEntity.Status == enrollment.StatusCompleted {
					progressLabel = "Terminé"
				}
			}

			cards = append(cards, learnerCourseCard{
				Course:        c,
				Enrollment:    enrollmentEntity,
				ProgressLabel: progressLabel,
				ModuleCount:   len(modules),
				NextModule:    nextModule,
			})
		}
		vm.Courses = cards
	}

	if err := learnerCatalogTmpl.ExecuteTemplate(w, "learn_catalog", vm); err != nil {
		log.Printf("learner: render catalog: %v", err)
		http.Error(w, "template rendering error", http.StatusInternalServerError)
	}
}

type moduleProgressView struct {
	Module     *ent.Module
	Status     string
	Completed  bool
	InProgress bool
}

type moduleContentView struct {
	Title       string
	Type        string
	Description string
	DownloadURL string
	DownloadTTL time.Time
	VideoURL    string
	ArticleBody string
	Duration    int
}

type learnerCourseViewModel struct {
	Page           string
	PageTitle      string
	CurrentYear    int
	FlashMessage   string
	FlashError     string
	OrganizationID uuid.UUID
	LearnerID      uuid.UUID
	Course         *ent.Course
	Enrollment     *ent.Enrollment
	Modules        []moduleProgressView
	SelectedModule *moduleProgressView
	Content        *moduleContentView
	LearnerName    string
}

func (h *LearnerHandler) courseDetail(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	orgID := selectUUIDParam(r, "org")
	userID := selectUUIDParam(r, "user")

	if orgID == uuid.Nil {
		http.Error(w, "organization required", http.StatusBadRequest)
		return
	}

	courseID, err := uuid.Parse(chi.URLParam(r, "courseID"))
	if err != nil {
		http.Error(w, "invalid course id", http.StatusBadRequest)
		return
	}

	courseEntity, err := h.courseService.Get(ctx, orgID, courseID)
	if err != nil {
		http.Error(w, "course not found", http.StatusNotFound)
		return
	}

	var learner *ent.User
	if userID != uuid.Nil {
		learner, err = h.userService.Get(ctx, orgID, userID)
		if err != nil {
			http.Error(w, "learner not found", http.StatusNotFound)
			return
		}
	}

	var enrollmentEntity *ent.Enrollment
	if learner != nil {
		list, err := h.enrollmentService.List(ctx, orgID, enrollment.EnrollmentFilter{
			CourseID: courseEntity.ID,
			UserID:   learner.ID,
		})
		if err != nil {
			http.Error(w, "unable to load enrollment", http.StatusInternalServerError)
			return
		}
		if len(list) > 0 {
			enrollmentEntity = list[0]
		}
	}

	modules, err := h.courseService.ListModules(ctx, orgID, courseEntity.ID)
	if err != nil {
		http.Error(w, "unable to list modules", http.StatusInternalServerError)
		return
	}

	moduleStates := make(map[uuid.UUID]moduleProgressView, len(modules))
	for _, m := range modules {
		moduleStates[m.ID] = moduleProgressView{
			Module: m,
			Status: progress.StatusNotStarted,
		}
	}

	if enrollmentEntity != nil {
		states, err := h.progressService.Get(ctx, orgID, enrollmentEntity.ID)
		if err != nil && !errors.Is(err, progress.ErrNotFound) {
			http.Error(w, "unable to load progress", http.StatusInternalServerError)
			return
		}
		for _, state := range states {
			if state.Module == nil {
				continue
			}
			view, ok := moduleStates[state.Module.ID]
			if !ok {
				view = moduleProgressView{Module: state.Module, Status: progress.StatusNotStarted}
			}
			status := progress.StatusNotStarted
			if state.Progress != nil {
				status = state.Progress.Status
			}
			view.Status = status
			view.Completed = status == progress.StatusCompleted
			view.InProgress = status == progress.StatusInProgress
			moduleStates[state.Module.ID] = view
		}
	}

	ordered := make([]moduleProgressView, 0, len(modules))
	for _, m := range modules {
		ordered = append(ordered, moduleStates[m.ID])
	}

	selectedModuleID := selectUUIDParam(r, "module")
	if selectedModuleID == uuid.Nil && len(ordered) > 0 {
		selectedModuleID = ordered[0].Module.ID
	}

	var selectedModule *moduleProgressView
	if selectedModuleID != uuid.Nil {
		if view, ok := moduleStates[selectedModuleID]; ok {
			selectedModule = &view
		}
	}

	var contentView *moduleContentView
	if selectedModule != nil {
		contentView, err = h.buildModuleContent(ctx, orgID, learner, enrollmentEntity, selectedModule.Module)
		if err != nil {
			http.Error(w, "unable to load module content", http.StatusInternalServerError)
			return
		}
	}

	vm := learnerCourseViewModel{
		Page:           "learn",
		PageTitle:      fmt.Sprintf("%s - Parcours", courseEntity.Title),
		CurrentYear:    time.Now().Year(),
		OrganizationID: orgID,
		LearnerID:      userID,
		Course:         courseEntity,
		Enrollment:     enrollmentEntity,
		Modules:        ordered,
		SelectedModule: selectedModule,
		Content:        contentView,
	}
	if learner != nil {
		vm.LearnerName = learner.Email
	}

	if err := learnerCourseTmpl.ExecuteTemplate(w, "learn_course", vm); err != nil {
		log.Printf("learner: render course: %v", err)
		http.Error(w, "template rendering error", http.StatusInternalServerError)
	}
}

func (h *LearnerHandler) buildModuleContent(ctx context.Context, orgID uuid.UUID, learner *ent.User, enrollmentEntity *ent.Enrollment, module *ent.Module) (*moduleContentView, error) {
	description := fmt.Sprintf("Type: %s", strings.ToUpper(module.ModuleType))
	view := moduleContentView{
		Title:       module.Title,
		Type:        module.ModuleType,
		Description: description,
		Duration:    module.DurationSeconds,
	}

	switch module.ModuleType {
	case "pdf", "scorm":
		if module.ContentID != nil {
			contentEntity, err := h.contentService.Get(ctx, orgID, *module.ContentID)
			if err != nil {
				return nil, err
			}
			view.Description = fmt.Sprintf("%s — %s", contentEntity.Name, contentEntity.MimeType)
			if contentEntity.Status == content.StatusAvailable {
				url, expires, err := h.contentService.PresignDownload(ctx, orgID, contentEntity.ID)
				if err == nil {
					view.DownloadURL = url
					view.DownloadTTL = expires
				}
			}
		}
	case "video":
		if val, ok := module.Data["video_url"].(string); ok {
			view.VideoURL = val
		}
	case "article":
		if val, ok := module.Data["body"].(string); ok {
			view.ArticleBody = val
		}
	case "quiz":
		view.Description = "Répondez au quiz pour valider ce module."
	}

	return &view, nil
}

func selectUUIDParam(r *http.Request, key string) uuid.UUID {
	val := strings.TrimSpace(r.URL.Query().Get(key))
	if val == "" {
		return uuid.Nil
	}
	id, err := uuid.Parse(val)
	if err != nil {
		return uuid.Nil
	}
	return id
}
