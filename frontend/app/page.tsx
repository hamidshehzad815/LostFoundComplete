"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAuthenticated, getUser } from "@/lib/auth";
import "./home.css";

export default function Home() {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setIsAuth(isAuthenticated());
    setUser(getUser());
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-media" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=2000&q=80"
            alt=""
          />
          <div className="hero-veil" />
        </div>

        <div className="hero-content container">
          <p className="hero-brand fade-up">Lost & Found</p>
          <h1 className="hero-title fade-up-delay">
            {isAuth
              ? `Welcome back, ${user?.username || "friend"}.`
              : "Help belongings find their way home."}
          </h1>
          <p className="hero-sub fade-up-delay">
            {isAuth
              ? "Post a lost or found item, or browse nearby reports from your community."
              : "A quiet place for your city to report lost items, return found ones, and reconnect people with what matters."}
          </p>
          <div className="hero-actions fade-up-delay">
            {isAuth ? (
              <>
                <Link href="/post?type=lost" className="btn btn-primary">
                  Report lost item
                </Link>
                <Link href="/explore" className="btn btn-secondary hero-btn-light">
                  Explore listings
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup" className="btn btn-primary">
                  Get started
                </Link>
                <Link href="/explore" className="btn btn-secondary hero-btn-light">
                  Browse items
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="home-section container">
        <h2 className="section-title">How it works</h2>
        <p className="section-sub">
          Three calm steps — no clutter, just the path from report to reunion.
        </p>
        <div className="steps">
          <article className="step">
            <span className="step-num">01</span>
            <h3>Report</h3>
            <p>Share what you lost or found with location, photos, and a clear description.</p>
          </article>
          <article className="step">
            <span className="step-num">02</span>
            <h3>Connect</h3>
            <p>Match nearby listings and message the right person privately when it looks familiar.</p>
          </article>
          <article className="step">
            <span className="step-num">03</span>
            <h3>Reunite</h3>
            <p>Confirm the return, close the listing, and leave a trail of trust for the community.</p>
          </article>
        </div>
      </section>

      <section className="home-cta">
        <div className="container home-cta-inner">
          <div>
            <h2 className="section-title">Built for trust, not noise.</h2>
            <p className="section-sub" style={{ marginBottom: 0 }}>
              Verified accounts, careful messaging, and a design that stays out of the way.
            </p>
          </div>
          <Link href={isAuth ? "/dashboard" : "/signup"} className="btn btn-primary">
            {isAuth ? "Open dashboard" : "Join the community"}
          </Link>
        </div>
      </section>

      <footer className="home-footer">
        <div className="container home-footer-inner">
          <span className="brand-text">Lost & Found</span>
          <span className="muted">Reunite people with what matters.</span>
        </div>
      </footer>
    </div>
  );
}
