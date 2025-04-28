import {clerkMiddleware, createRouteMatcher} from "@clerk/nextjs/server";

// On protège explicitement les routes sensibles, PAS la home
const isProtectedRoute = createRouteMatcher([
  "/inscriptions/:path*",
  "/pdf-preview/:path*",
  "/api/:path*",
  "/trpc/:path*",
  "/sign-in(.*)",
]);

// Préfixes des API publiques
const publicApiPrefixes = ["/api/inscriptions", "/api/competitors"];

// Fonction pour savoir si une page d'inscription individuelle est publique
function isPublicInscriptionPage(url: string) {
  // /inscriptions/quelquechose mais PAS /inscriptions/new ou autre sous-page
  const match = url.match(/^\/inscriptions\/([^\/]+)$/);
  if (!match) return false;
  const id = match[1];
  // Exclure les routes comme /inscriptions/new, /inscriptions/secret, etc.
  return id !== "new";
}

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl.pathname;
  // API publiques
  if (
    publicApiPrefixes.some(
      (prefix) => url === prefix || url.startsWith(prefix + "/")
    )
  )
    return;
  // Page d'inscription individuelle publique
  if (isPublicInscriptionPage(url)) return;
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/inscriptions/:path*",
    "/pdf-preview/:path*",
    "/api/:path*",
    "/trpc/:path*",
    "/sign-in(.*)",
  ],
};
