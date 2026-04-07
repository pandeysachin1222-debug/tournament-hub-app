import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 🔐 Login
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login Successful");
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 🆕 Signup
  const handleSignup = async () => {
    if (password !== confirmPassword) {
      alert("Password match nahi ho raha");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Account Created Successfully");
      setIsSignup(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 📩 Forgot Password
  const handleForgotPassword = async () => {
    if (!email) {
      alert("Email daalo pehle");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Reset link email pe bhej diya");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>{isSignup ? "Signup" : "Login"}</h2>

      <input
        type="email"
        placeholder="Enter Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Enter Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      {isSignup && (
        <>
          <input
            type="password"
            placeholder="Confirm Password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <br /><br />
        </>
      )}

      <button onClick={isSignup ? handleSignup : handleLogin}>
        {isSignup ? "Signup" : "Login"}
      </button>

      <br /><br />

      <p onClick={() => setIsSignup(!isSignup)} style={{ cursor: "pointer" }}>
        {isSignup ? "Already have account? Login" : "Create new account"}
      </p>

      <p onClick={handleForgotPassword} style={{ color: "blue", cursor: "pointer" }}>
        Forgot Password?
      </p>
    </div>
  );
}
