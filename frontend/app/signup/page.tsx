"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAuthToken, setUser } from "@/lib/auth";
import { API_ENDPOINTS } from "@/lib/config";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      setSuccess(true);
      setError("");

      setTimeout(() => {
        router.push("/login?signup=success");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength < 40) return "#ef4444";
    if (passwordStrength < 70) return "#f59e0b";
    return "#10b981";
  };

  const getStrengthText = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 70) return "Medium";
    return "Strong";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        background: "var(--pink)",
        paddingTop: "6rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "var(--white)",
          border: "6px solid var(--black)",
          boxShadow: "12px 12px 0 var(--black)",
          padding: "3rem",
          transform: "rotate(0.5deg)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              fontSize: "4rem",
              marginBottom: "1rem",
              fontWeight: 900,
            }}
          >
            🔍
          </div>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 900,
              color: "var(--black)",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
            }}
          >
            JOIN LOST & FOUND
          </h1>
          <p
            style={{
              color: "var(--black)",
              fontSize: "1rem",
              fontWeight: 700,
            }}
          >
            Create your account to start helping
          </p>
        </div>

        {success && (
          <div
            style={{
              padding: "1.5rem",
              backgroundColor: "var(--green)",
              border: "4px solid var(--black)",
              boxShadow: "5px 5px 0 var(--black)",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "2.5rem",
                marginBottom: "0.75rem",
                fontWeight: 900,
              }}
            >
              ✓
            </div>
            <p
              style={{
                color: "var(--black)",
                fontWeight: 900,
                marginBottom: "0.5rem",
                textTransform: "uppercase",
                fontSize: "1.1rem",
              }}
            >
              ACCOUNT CREATED!
            </p>
            <p
              style={{
                color: "var(--black)",
                fontSize: "0.9rem",
                fontWeight: 700,
              }}
            >
              Check your email to verify your account
            </p>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "1.25rem",
              backgroundColor: "var(--red)",
              border: "4px solid var(--black)",
              boxShadow: "4px 4px 0 var(--black)",
              color: "var(--white)",
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div>
            <label
              htmlFor="username"
              style={{
                display: "block",
                marginBottom: "0.75rem",
                fontWeight: 900,
                fontSize: "0.9rem",
                color: "var(--black)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              minLength={3}
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              style={{
                width: "100%",
                padding: "1rem 1.25rem",
                border: "4px solid var(--black)",
                fontSize: "1rem",
                fontWeight: 700,
                outline: "none",
                backgroundColor: "var(--white)",
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = "4px 4px 0 var(--black)";
                e.target.style.transform = "translate(-2px, -2px)";
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = "none";
                e.target.style.transform = "none";
              }}
              placeholder="johndoe"
            />
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--black)",
                marginTop: "0.5rem",
                fontWeight: 700,
              }}
            >
              MIN 3 CHARACTERS
            </p>
          </div>

          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "0.75rem",
                fontWeight: 900,
                fontSize: "0.9rem",
                color: "var(--black)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              style={{
                width: "100%",
                padding: "1rem 1.25rem",
                border: "4px solid var(--black)",
                fontSize: "1rem",
                fontWeight: 700,
                outline: "none",
                backgroundColor: "var(--white)",
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = "4px 4px 0 var(--black)";
                e.target.style.transform = "translate(-2px, -2px)";
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = "none";
                e.target.style.transform = "none";
              }}
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "0.75rem",
                fontWeight: 900,
                fontSize: "0.9rem",
                color: "var(--black)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              style={{
                width: "100%",
                padding: "1rem 1.25rem",
                border: "4px solid var(--black)",
                fontSize: "1rem",
                fontWeight: 700,
                outline: "none",
                backgroundColor: "var(--white)",
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = "4px 4px 0 var(--black)";
                e.target.style.transform = "translate(-2px, -2px)";
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = "none";
                e.target.style.transform = "none";
              }}
              placeholder="••••••••"
            />
            {formData.password && (
              <div style={{ marginTop: "0.75rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--black)",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Strength
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 900,
                      color: "var(--black)",
                      textTransform: "uppercase",
                      backgroundColor: getStrengthColor(),
                      padding: "0.25rem 0.5rem",
                      border: "2px solid var(--black)",
                    }}
                  >
                    {getStrengthText()}
                  </span>
                </div>
                <div
                  style={{
                    height: "8px",
                    backgroundColor: "var(--white)",
                    border: "3px solid var(--black)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${passwordStrength}%`,
                      backgroundColor: getStrengthColor(),
                      border:
                        passwordStrength > 0
                          ? "2px solid var(--black)"
                          : "none",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              style={{
                display: "block",
                marginBottom: "0.75rem",
                fontWeight: 900,
                fontSize: "0.9rem",
                color: "var(--black)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              style={{
                width: "100%",
                padding: "1rem 1.25rem",
                border: "4px solid var(--black)",
                fontSize: "1rem",
                fontWeight: 700,
                outline: "none",
                backgroundColor: "var(--white)",
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = "4px 4px 0 var(--black)";
                e.target.style.transform = "translate(-2px, -2px)";
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = "none";
                e.target.style.transform = "none";
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            style={{
              width: "100%",
              padding: "1.25rem",
              backgroundColor: success ? "var(--green)" : "var(--black)",
              color: "var(--white)",
              border: "4px solid var(--black)",
              fontSize: "1.1rem",
              fontWeight: 900,
              cursor: loading || success ? "not-allowed" : "pointer",
              marginTop: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              boxShadow: "6px 6px 0 var(--orange)",
              transform: "rotate(0.5deg)",
            }}
            onMouseEnter={(e) => {
              if (!loading && !success) {
                e.currentTarget.style.backgroundColor = "var(--purple)";
                e.currentTarget.style.transform =
                  "rotate(0.5deg) translate(-3px, -3px)";
                e.currentTarget.style.boxShadow = "9px 9px 0 var(--orange)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && !success) {
                e.currentTarget.style.backgroundColor = "var(--black)";
                e.currentTarget.style.transform = "rotate(0.5deg)";
                e.currentTarget.style.boxShadow = "6px 6px 0 var(--orange)";
              }
            }}
          >
            {loading
              ? "CREATING ACCOUNT..."
              : success
                ? "✓ ACCOUNT CREATED!"
                : "CREATE ACCOUNT"}
          </button>
        </form>

        <div
          style={{
            margin: "2rem 0 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{ flex: 1, height: "3px", backgroundColor: "var(--black)" }}
          ></div>
          <span
            style={{
              color: "var(--black)",
              fontSize: "0.9rem",
              fontWeight: 900,
              letterSpacing: "0.1em",
            }}
          >
            OR
          </span>
          <div
            style={{ flex: 1, height: "3px", backgroundColor: "var(--black)" }}
          ></div>
        </div>

        <a
          href={API_ENDPOINTS.GOOGLE_AUTH}
          style={{
            width: "100%",
            padding: "1.25rem",
            backgroundColor: "var(--white)",
            color: "var(--black)",
            border: "4px solid var(--black)",
            fontSize: "1rem",
            fontWeight: 900,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            textDecoration: "none",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            boxShadow: "5px 5px 0 var(--black)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--cyan)";
            e.currentTarget.style.transform = "translate(-2px, -2px)";
            e.currentTarget.style.boxShadow = "7px 7px 0 var(--black)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--white)";
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "5px 5px 0 var(--black)";
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </a>

        <p
          style={{
            textAlign: "center",
            marginTop: "2.5rem",
            color: "var(--black)",
            fontSize: "0.95rem",
            fontWeight: 700,
          }}
        >
          ALREADY HAVE AN ACCOUNT?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--black)",
              fontWeight: 900,
              textDecoration: "underline",
              textDecorationThickness: "3px",
              textUnderlineOffset: "3px",
              textDecorationColor: "var(--orange)",
            }}
          >
            LOGIN HERE
          </Link>
        </p>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }
      `}</style>
    </div>
  );
}
