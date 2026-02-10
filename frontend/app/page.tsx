"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAuthenticated, getUser } from "@/lib/auth";

export default function Home() {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setIsAuth(isAuthenticated());
    setUser(getUser());
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingTop: "70px",
        background: "var(--white)",
      }}
    >
      {/* Hero Section */}
      <section
        style={{
          background: "var(--yellow)",
          padding: "6rem 1.5rem",
          textAlign: "center",
          color: "var(--black)",
          border: "8px solid var(--black)",
          borderTop: "none",
          boxShadow: "0 12px 0px 0px rgba(0, 0, 0, 1)",
        }}
      >
        <div
          className="container"
          style={{ maxWidth: "1200px", margin: "0 auto" }}
        >
          <h1
            style={{
              fontSize: "clamp(2.5rem, 5vw, 5rem)",
              fontWeight: 900,
              marginBottom: "2rem",
              lineHeight: 1,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              textShadow: "4px 4px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            Lost Something? Found Something?
          </h1>
          <p
            style={{
              fontSize: "clamp(1.125rem, 2vw, 1.5rem)",
              marginBottom: "3rem",
              maxWidth: "800px",
              margin: "0 auto 3rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {isAuth
              ? `Welcome back, ${user?.username}! Continue helping the community reunite people with their belongings.`
              : "Join our community to help reunite people with their belongings. Post lost items, report found items, and make a difference."}
          </p>
          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {isAuth ? (
              <>
                <Link
                  href="/dashboard"
                  style={{
                    padding: "1.25rem 3rem",
                    backgroundColor: "var(--black)",
                    color: "var(--yellow)",
                    textDecoration: "none",
                    fontWeight: 900,
                    fontSize: "1.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    border: "5px solid var(--black)",
                    boxShadow: "8px 8px 0px 0px rgba(0, 0, 0, 1)",
                    transition: "all 0.2s ease",
                    display: "inline-block",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translate(8px, 8px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "8px 8px 0px 0px rgba(0, 0, 0, 1)";
                    e.currentTarget.style.transform = "translate(0, 0)";
                  }}
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/explore"
                  style={{
                    padding: "1.25rem 3rem",
                    backgroundColor: "var(--white)",
                    color: "var(--black)",
                    textDecoration: "none",
                    fontWeight: 900,
                    fontSize: "1.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    border: "5px solid var(--black)",
                    boxShadow: "8px 8px 0px 0px rgba(0, 0, 0, 1)",
                    transition: "all 0.2s ease",
                    display: "inline-block",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--pink)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translate(8px, 8px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--white)";
                    e.currentTarget.style.boxShadow =
                      "8px 8px 0px 0px rgba(0, 0, 0, 1)";
                    e.currentTarget.style.transform = "translate(0, 0)";
                  }}
                >
                  Explore Items
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  style={{
                    padding: "1.25rem 3rem",
                    backgroundColor: "var(--black)",
                    color: "var(--yellow)",
                    textDecoration: "none",
                    fontWeight: 900,
                    fontSize: "1.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    border: "5px solid var(--black)",
                    boxShadow: "8px 8px 0px 0px rgba(0, 0, 0, 1)",
                    transition: "all 0.2s ease",
                    display: "inline-block",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translate(8px, 8px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "8px 8px 0px 0px rgba(0, 0, 0, 1)";
                    e.currentTarget.style.transform = "translate(0, 0)";
                  }}
                >
                  Get Started Free
                </Link>
                <Link
                  href="/explore"
                  style={{
                    padding: "1.25rem 3rem",
                    backgroundColor: "var(--white)",
                    color: "var(--black)",
                    textDecoration: "none",
                    fontWeight: 900,
                    fontSize: "1.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    border: "5px solid var(--black)",
                    boxShadow: "8px 8px 0px 0px rgba(0, 0, 0, 1)",
                    transition: "all 0.2s ease",
                    display: "inline-block",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--pink)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translate(8px, 8px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--white)";
                    e.currentTarget.style.boxShadow =
                      "8px 8px 0px 0px rgba(0, 0, 0, 1)";
                    e.currentTarget.style.transform = "translate(0, 0)";
                  }}
                >
                  Browse Items
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        style={{ padding: "5rem 1.5rem", backgroundColor: "var(--white)" }}
      >
        <div
          className="container"
          style={{ maxWidth: "1200px", margin: "0 auto" }}
        >
          <h2
            style={{
              fontSize: "clamp(2.5rem, 4vw, 4rem)",
              fontWeight: 900,
              textAlign: "center",
              marginBottom: "4rem",
              color: "var(--black)",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
            }}
          >
            How It Works
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2rem",
            }}
          >
            {[
              {
                icon: "📱",
                title: "Report Lost Items",
                desc: "Create a detailed post about your lost item with photos, description, and location.",
              },
              {
                icon: "🔍",
                title: "Search & Match",
                desc: "Browse through found items or search for your lost belongings using filters and location.",
              },
              {
                icon: "💬",
                title: "Connect Safely",
                desc: "Communicate securely with finders or owners to arrange safe returns.",
              },
              {
                icon: "🎉",
                title: "Reunite & Recover",
                desc: "Successfully reunite items with their owners and build trust in the community.",
              },
            ].map((feature, i) => {
              const colors = [
                "var(--pink)",
                "var(--cyan)",
                "var(--purple)",
                "var(--orange)",
              ];
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: colors[i],
                    padding: "2.5rem",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    border: "6px solid var(--black)",
                    cursor: "pointer",
                    boxShadow: "8px 8px 0px 0px rgba(0, 0, 0, 1)",
                    transform: i % 2 === 0 ? "rotate(-1deg)" : "rotate(1deg)",
                  }}
                  onMouseEnter={(e) => {
                    const currentRotation =
                      i % 2 === 0 ? "rotate(-1deg)" : "rotate(1deg)";
                    e.currentTarget.style.transform = `${currentRotation} translate(8px, 8px)`;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onMouseLeave={(e) => {
                    const currentRotation =
                      i % 2 === 0 ? "rotate(-1deg)" : "rotate(1deg)";
                    e.currentTarget.style.transform = currentRotation;
                    e.currentTarget.style.boxShadow =
                      "8px 8px 0px 0px rgba(0, 0, 0, 1)";
                  }}
                >
                  <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>
                    {feature.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 900,
                      marginBottom: "1rem",
                      color: "var(--black)",
                      textTransform: "uppercase",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      color: "var(--black)",
                      fontSize: "1.125rem",
                      lineHeight: 1.6,
                      fontWeight: 700,
                    }}
                  >
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        style={{ padding: "5rem 1.5rem", backgroundColor: "var(--bg-urgent)" }}
      >
        <div
          className="container"
          style={{ maxWidth: "1200px", margin: "0 auto" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "2.5rem",
              textAlign: "center",
            }}
          >
            {[
              { number: "1,000+", label: "Items Posted" },
              { number: "500+", label: "Successful Returns" },
              { number: "2,500+", label: "Community Members" },
              { number: "98%", label: "Satisfaction Rate" },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  padding: "2rem",
                  backgroundColor: "var(--white)",
                  border: "6px solid var(--black)",
                  boxShadow: "8px 8px 0px 0px rgba(0, 0, 0, 1)",
                }}
              >
                <div
                  style={{
                    fontSize: "3.5rem",
                    fontWeight: 900,
                    color: "var(--black)",
                    marginBottom: "0.75rem",
                    lineHeight: 1,
                  }}
                >
                  {stat.number}
                </div>
                <div
                  style={{
                    fontSize: "1.125rem",
                    color: "var(--black)",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          background: "var(--purple)",
          padding: "5rem 1.5rem",
          textAlign: "center",
          color: "var(--white)",
          border: "8px solid var(--black)",
          borderLeft: "none",
          borderRight: "none",
        }}
      >
        <div
          className="container"
          style={{ maxWidth: "1200px", margin: "0 auto" }}
        >
          <h2
            style={{
              fontSize: "clamp(2.5rem, 4vw, 4rem)",
              fontWeight: 900,
              marginBottom: "2rem",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
            }}
          >
            Ready to Make a Difference?
          </h2>
          <p
            style={{
              fontSize: "1.375rem",
              marginBottom: "3rem",
              maxWidth: "700px",
              margin: "0 auto 3rem",
              fontWeight: 700,
            }}
          >
            {isAuth
              ? "Start posting lost or found items to help the community."
              : "Join thousands of community members helping each other recover lost items every day."}
          </p>
          {isAuth ? (
            <Link
              href="/dashboard"
              style={{
                padding: "1.25rem 3.5rem",
                backgroundColor: "var(--yellow)",
                color: "var(--black)",
                textDecoration: "none",
                fontWeight: 900,
                fontSize: "1.5rem",
                display: "inline-block",
                transition: "all 0.2s ease",
                border: "5px solid var(--black)",
                boxShadow: "10px 10px 0px 0px rgba(0, 0, 0, 1)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translate(10px, 10px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "10px 10px 0px 0px rgba(0, 0, 0, 1)";
                e.currentTarget.style.transform = "translate(0, 0)";
              }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/signup"
              style={{
                padding: "1.25rem 3.5rem",
                backgroundColor: "var(--yellow)",
                color: "var(--black)",
                textDecoration: "none",
                fontWeight: 900,
                fontSize: "1.5rem",
                display: "inline-block",
                transition: "all 0.2s ease",
                border: "5px solid var(--black)",
                boxShadow: "10px 10px 0px 0px rgba(0, 0, 0, 1)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translate(10px, 10px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "10px 10px 0px 0px rgba(0, 0, 0, 1)";
                e.currentTarget.style.transform = "translate(0, 0)";
              }}
            >
              Sign Up Now
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "var(--black)",
          color: "var(--yellow)",
          padding: "3rem 1.5rem",
          textAlign: "center",
          border: "8px solid var(--black)",
          borderBottom: "none",
          borderLeft: "none",
          borderRight: "none",
        }}
      >
        <div
          className="container"
          style={{ maxWidth: "1200px", margin: "0 auto" }}
        >
          <p
            style={{
              fontSize: "1rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            © 2026 Lost & Found. Helping reunite people with their belongings.
          </p>
        </div>
      </footer>
    </div>
  );
}
