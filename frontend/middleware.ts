import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/sign-in",
  },
});

export const config = {
  matcher: ["/transactions/:path*", "/credits/:path*", "/loans/:path*", "/admin/:path*"],
};
