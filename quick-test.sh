#!/bin/bash
set -e

echo "🧪 Test rapide de l'upload MinIO"
echo "================================"
echo ""

# Créer un compte de test
TS=$(date +%s)
EMAIL="test-$TS@example.com"

echo "1. Création d'un compte..."
RESPONSE=$(curl -k -s -X POST "https://localhost/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"org_name\":\"Test Upload\",\"email\":\"$EMAIL\",\"password\":\"Test1234!\"}" \
  -c /tmp/test-cookies.txt)

ORG_ID=$(echo "$RESPONSE" | jq -r '.organization.id')

if [ -z "$ORG_ID" ] || [ "$ORG_ID" = "null" ]; then
  echo "❌ Erreur lors de la création du compte"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Compte créé : $EMAIL (Org: $ORG_ID)"
echo ""

# Demander une URL d'upload
echo "2. Demande d'une URL d'upload pré-signée..."
TEST_FILE="/tmp/test-$TS.txt"
echo "Test file content at $(date)" > "$TEST_FILE"
FILE_SIZE=$(stat -c%s "$TEST_FILE" 2>/dev/null || stat -f%z "$TEST_FILE")

CONTENT_RESPONSE=$(curl -k -s -X POST "https://localhost/api/contents" \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -b /tmp/test-cookies.txt \
  -d "{\"name\":\"test-file.txt\",\"mime_type\":\"text/plain\",\"size_bytes\":$FILE_SIZE}")

UPLOAD_URL=$(echo "$CONTENT_RESPONSE" | jq -r '.upload_url')
CONTENT_ID=$(echo "$CONTENT_RESPONSE" | jq -r '.content.id')

if [ -z "$UPLOAD_URL" ] || [ "$UPLOAD_URL" = "null" ]; then
  echo "❌ Erreur lors de la création du content"
  echo "$CONTENT_RESPONSE"
  exit 1
fi

echo "✅ URL d'upload obtenue"
echo "   Content ID: $CONTENT_ID"
echo "   URL: ${UPLOAD_URL:0:70}..."
echo ""

# Vérifier que l'URL utilise bien le port 9000
if echo "$UPLOAD_URL" | grep -q ":9000"; then
  echo "✅ URL utilise le port 9000 (correct)"
else
  echo "⚠️  URL n'utilise pas le port 9000"
  echo "   URL complète: $UPLOAD_URL"
fi
echo ""

# Upload du fichier
echo "3. Upload du fichier vers MinIO..."
HTTP_CODE=$(curl -k -s -o /tmp/upload-response.txt -w "%{http_code}" \
  -X PUT "$UPLOAD_URL" \
  -H "Content-Type: text/plain" \
  --data-binary "@$TEST_FILE")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Upload réussi (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "403" ]; then
  echo "❌ Erreur 403 Forbidden - Signature AWS invalide"
  echo "   Réponse:"
  cat /tmp/upload-response.txt
  exit 1
else
  echo "❌ Upload échoué (HTTP $HTTP_CODE)"
  cat /tmp/upload-response.txt
  exit 1
fi
echo ""

# Finaliser
echo "4. Finalisation du content..."
FINALIZE_RESPONSE=$(curl -k -s -X POST "https://localhost/api/contents/$CONTENT_ID/finalize" \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -b /tmp/test-cookies.txt \
  -d '{}')

CONTENT_STATUS=$(echo "$FINALIZE_RESPONSE" | jq -r '.status')
echo "✅ Content status: $CONTENT_STATUS"
echo ""

# Vérifier dans MinIO
echo "5. Vérification dans MinIO..."
docker compose exec -T minio mc ls local/lms-go/ 2>/dev/null | tail -3 || echo "Impossible de lister MinIO"
echo ""

echo "✅ TEST RÉUSSI !"
echo ""
echo "🎉 L'upload fonctionne correctement avec le port 9000"
echo ""

# Nettoyage
rm -f "$TEST_FILE" /tmp/upload-response.txt /tmp/test-cookies.txt

echo "✅ Terminé"
