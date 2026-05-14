'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    organisation: '',
    designation: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.message.trim()) e.message = 'Message is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    console.log('InventisLabs Contact Submission:', {
      ...form,
      submittedAt: new Date().toISOString(),
    });
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className={styles.page}>

      <div className={styles.dotGrid} aria-hidden="true" />
      <div className={styles.dotMask} aria-hidden="true" />

      <div className={`${styles.cm} ${styles.cmTl}`} aria-hidden="true" />
      <div className={`${styles.cm} ${styles.cmTr}`} aria-hidden="true" />
      <div className={`${styles.cm} ${styles.cmBl}`} aria-hidden="true" />
      <div className={`${styles.cm} ${styles.cmBr}`} aria-hidden="true" />

      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>
          <div className={styles.logoMark}>
            <div className={styles.logoBars}>
              {[6, 11, 16, 9, 13].map((h, i) => (
                <span key={i} style={{ height: h }} />
              ))}
            </div>
          </div>
          <div>
            <div className={styles.logoName}>Inventis<span>Labs</span></div>
            <div className={styles.logoSub}>IIT ROORKEE INCUBATED</div>
          </div>
        </Link>

        <div className={styles.navRight}>
          <Link href="/" className={styles.navBack}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
            Back to Home
          </Link>
        </div>
      </nav>

      <div className={styles.main}>

        <div className={styles.left}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowPill}>Get in Touch</span>
            <span className={styles.eyebrowDash} />
          </div>

          <h1 className={styles.title}>
            Let's talk about<br />
            <span className={styles.accent}>protecting India</span><br />
            <span className={styles.thin}>together.</span>
          </h1>

          <p className={styles.desc}>
            Whether you represent a government body, research institution, or are interested in deploying EEWS — we'd love to hear from you.
          </p>

          <div className={styles.contactCards}>
            <div className={styles.contactCard}>
              <div className={styles.contactCardIcon}>
                <i className="ti ti-building-community" aria-hidden="true" />
              </div>
              <div>
                <div className={styles.contactCardTitle}>InventisLabs</div>
                <div className={styles.contactCardSub}>Incubated at IIT Roorkee</div>
              </div>
            </div>
            <div className={styles.contactCard}>
              <div className={styles.contactCardIcon}>
                <i className="ti ti-map-pin" aria-hidden="true" />
              </div>
              <div>
                <div className={styles.contactCardTitle}>IIT Roorkee Campus</div>
                <div className={styles.contactCardSub}>Roorkee, Uttarakhand — 247667</div>
              </div>
            </div>
            <div className={styles.contactCard}>
              <div className={styles.contactCardIcon}>
                <i className="ti ti-seeding" aria-hidden="true" />
              </div>
              <div>
                <div className={styles.contactCardTitle}>EEWS — Gen 1</div>
                <div className={styles.contactCardSub}>India's first indigenous early warning system</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.right}>
          {submitted ? (
            <div className={styles.successCard}>
              <div className={styles.successIcon}>
                <i className="ti ti-circle-check" aria-hidden="true" />
              </div>
              <div className={styles.successTitle}>Message received</div>
              <div className={styles.successSub}>
                Thank you, <strong>{form.name}</strong>. We'll get back to you at <strong>{form.email}</strong> shortly.
              </div>
              <div className={styles.successMeta}>
                <span className={styles.successMetaDot} />
                Submission logged · {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
              <Link href="/" className={styles.successBtn}>
                <i className="ti ti-home" aria-hidden="true" />
                Back to Home
              </Link>
            </div>
          ) : (
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <div className={styles.formTitle}>Contact Form</div>
                <div className={styles.formSub}>Fields marked <span className={styles.req}>*</span> are required</div>
              </div>

              <form onSubmit={handleSubmit} className={styles.form} noValidate>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      Full Name <span className={styles.req}>*</span>
                    </label>
                    <input
                      className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                      type="text"
                      name="name"
                      placeholder="Aryan Saini"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                    />
                    {errors.name && <span className={styles.error}>{errors.name}</span>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      Email Address <span className={styles.req}>*</span>
                    </label>
                    <input
                      className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                    />
                    {errors.email && <span className={styles.error}>{errors.email}</span>}
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      Organisation <span className={styles.optional}>(optional)</span>
                    </label>
                    <input
                      className={styles.input}
                      type="text"
                      name="organisation"
                      placeholder="Ministry of Earth Sciences"
                      value={form.organisation}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      Designation <span className={styles.optional}>(optional)</span>
                    </label>
                    <input
                      className={styles.input}
                      type="text"
                      name="designation"
                      placeholder="Director, Seismology"
                      value={form.designation}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    Message <span className={styles.req}>*</span>
                  </label>
                  <textarea
                    className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
                    name="message"
                    placeholder="Tell us about your interest in EEWS — deployment queries, partnership opportunities, or general enquiries..."
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                  />
                  {errors.message && <span className={styles.error}>{errors.message}</span>}
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-send" aria-hidden="true" />
                      Send Message
                    </>
                  )}
                </button>

              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}