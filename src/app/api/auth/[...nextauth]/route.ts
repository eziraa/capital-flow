import { handlers } from "@/auth";

// NextAuth's own authentication endpoint. This is the one expected
// exception to the Server Action / route handler preference — NextAuth
// owns this route.
export const { GET, POST } = handlers;
