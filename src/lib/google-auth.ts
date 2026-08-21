import { lovable } from "@/integrations/lovable/index";

export async function lovableSignInWithGoogle() {
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
}
