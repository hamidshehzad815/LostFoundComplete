"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthToken, setUser } from "@/lib/auth";
import { API_ENDPOINTS } from "@/lib/config";

export default function LoginClient() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccess("Email verified successfully! You can now login.");
    } else if (searchParams.get("signup") === "success") {
      setSuccess(
        "Account created! Please check your email to verify your account.",
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      setAuthToken(data.token);
      setUser(data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        background: "var(--yellow)",
        paddingTop: "6rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          backgroundColor: "var(--white)",
          border: "6px solid var(--black)",
          boxShadow: "10px 10px 0 var(--black)",
          padding: "3rem",
          transform: "rotate(-0.5deg)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem", fontWeight: 900 }}>👋</div>
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
            WELCOME BACK
          </h1>
          <p style={{ color: "var(--black)", fontSize: "1rem", fontWeight: 700 }}>
            Login to continue helping the community
          </p>
        </div>

        {success && (
          <div
            style={{
              padding: "1.25rem",
              backgroundColor: "var(--green)",
              border: "4px solid var(--black)",
              boxShadow: "4px 4px 0 var(--black)",
              color: "var(--black)",
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
              textAlign: "center",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {success}
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
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
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
              placeholder="••••••••"
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.85rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              <input
                type="checkbox"
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  cursor: "pointer",
                  border: "3px solid var(--black)",
                }}
              />
              <span style={{ color: "var(--black)" }}>REMEMBER ME</span>
            </label>
            <Link
              href="/forgot-password"
              style={{
                color: "var(--black)",
                fontWeight: 700,
                textDecoration: "underline",
                textDecorationThickness: "2px",
                textUnderlineOffset: "3px",
              }}
            >
              FORGOT PASSWORD?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "1.25rem",
              backgroundColor: "var(--black)",
              color: "var(--white)",
              border: "4px solid var(--black)",
              fontSize: "1.1rem",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              boxShadow: "6px 6px 0 var(--yellow)",
              transform: "rotate(-0.5deg)",
            }}
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
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
        >
          <span style={{ fontSize: "1.25rem" }}>🔐</span>
          Continue with Google
        </a>

        <div style={{ marginTop: "2.5rem", textAlign: "center" }}>
          <p
            style={{
              color: "var(--black)",
              fontSize: "0.95rem",
              fontWeight: 700,
            }}
          >
            DON'T HAVE AN ACCOUNT?{" "}
            <Link
              href="/signup"
              style={{
                color: "var(--black)",
                fontWeight: 900,
                textDecoration: "underline",
                textDecorationThickness: "3px",
                textUnderlineOffset: "3px",
                textDecorationColor: "var(--purple)",
              }}
            >
              SIGN UP HERE
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
