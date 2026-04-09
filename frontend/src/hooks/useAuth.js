import { useEffect, useState } from "react";
import { authApi } from "../services/api.js";

export default function useAuth() {
  const [role, setRole] = useState(authApi.getRole());
  const [loggedIn, setLoggedIn] = useState(authApi.isLoggedIn());
  const [verificationStatus, setVerificationStatus] = useState(
    localStorage.getItem("vp_verification_status") || ""
  );
  const [docVerifyStatus, setDocVerifyStatus] = useState(
    localStorage.getItem("vp_doc_verify_status") || ""
  );

  useEffect(() => {
    const sync = () => {
      setRole(authApi.getRole());
      setLoggedIn(authApi.isLoggedIn());
      setVerificationStatus(localStorage.getItem("vp_verification_status") || "");
      setDocVerifyStatus(localStorage.getItem("vp_doc_verify_status") || "");
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return { role, loggedIn, verificationStatus, docVerifyStatus };
}
