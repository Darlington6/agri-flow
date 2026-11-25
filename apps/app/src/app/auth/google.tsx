import { GoogleReturn } from '@/screens/google-return'

// Google's redirect back to the web build. Each address it can come back to
// (http://localhost:8081/auth/google locally) is listed in the Google Cloud console.
export default function GoogleReturnRoute() {
  return <GoogleReturn />
}
