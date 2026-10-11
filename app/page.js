"use client";

import styles from "./page.module.css";
import Link from 'next/link';
import { useEffect, useRef } from "react";
import { DEVICES, SITE, hasFirebaseFeed } from "@/lib/devices";

// The hero status card showcases the device that streams real readings.
const FEATURED_DEVICE = DEVICES.find(hasFirebaseFeed) ?? DEVICES[0];

const HOW_STEPS = [
  {
    num: "01",
    icon: "ti-wave-saw-tool",
    title: "Seismic Detection",
    desc: "The EEWS device continuously measures ground acceleration across three axes using a precision triaxial accelerometer installed at the deployment site.",
  },
  {
    num: "02",
    icon: "ti-math-function",
    title: "Signal Processing",
    desc: "Raw X, Y, Z readings are converted into a single vibration intensity magnitude and compared against an adaptive self-calibrating baseline.",
  },
  {
    num: "03",
    icon: "ti-cloud-upload",
    title: "Real-Time Transmission",
    desc: "Processed data streams to a cloud database every 500ms, making readings instantly available to the monitoring dashboard anywhere in the world.",
  },
  {
    num: "04",
    icon: "ti-bell-ringing",
    title: "Alert Triggered",
    desc: "When intensity deviates beyond the safety threshold, an immediate audio and visual alert is dispatched to operators — seconds before shaking arrives.",
  },
];

export default function HomePage() {
  const navRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        if (window.scrollY > 10) {
          navRef.current.classList.add(styles.navScrolled);
        } else {
          navRef.current.classList.remove(styles.navScrolled);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className={styles.main}>
      <nav className={styles.nav} ref={navRef}>
        <div className={styles.navLogo}>
          <div className={styles.logoMark}>
            <div className={styles.logoBars}>
              {[6, 11, 16, 9, 13].map((h, i) => (
                <span key={i} style={{ height: h }} />
              ))}
            </div>
          </div>
          <div>
            <div className={styles.logoName}>
              Inventis<span>Labs</span>
            </div>
            <div className={styles.logoSub}>IIIT LUCKNOW INCUBATED</div>
          </div>
        </div>

        <div className={styles.navLinks}>
          <a href="#about">About</a>
          <a href="#device">Technology</a>
          <a href="#network">Network</a>
          <a href="/triangulation">Triangulation</a>
          <a href="/contact">Contact</a>
        </div>

        <div className={styles.navRight}>
          <div className={styles.navStatus}>
            <span className={styles.pulse} />
            EEWS TRANSMITTING
          </div>
          <button
            className={styles.navBtn}
            onClick={() => (window.location.href = "/map")}
          >
            <i className="ti ti-map" aria-hidden="true" />
            Live Map
          </button>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.dotGrid} aria-hidden="true" />
        <div className={styles.dotMask} aria-hidden="true" />
        <div className={`${styles.cm} ${styles.cmTl}`} aria-hidden="true" />
        <div className={`${styles.cm} ${styles.cmTr}`} aria-hidden="true" />
        <div className={`${styles.cm} ${styles.cmBl}`} aria-hidden="true" />
        <div className={`${styles.cm} ${styles.cmBr}`} aria-hidden="true" />
        <div className={styles.sysTag} aria-hidden="true">
          SYS.STATUS // EEWS-001 // OPERATIONAL
        </div>

        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowPill}>EQ-Alert — Gen 1</span>
              <span className={styles.eyebrowDash} />
              <span className={styles.eyebrowTxt}>IIIT Lucknow Incubated</span>
            </div>

            <h1 className={styles.heroTitle}>
              Detect.
              <br />
              <span className={styles.accent}>Warn.</span>
              <br />
              <span className={styles.thin}>Protect.</span>
            </h1>
            <p className={styles.heroSubhead}>
              Earthquake Early Warning System
            </p>

            <p className={styles.heroDesc}>
              <strong>InventisLabs</strong> has built India&apos;s first
              indigenous seismic early warning device — deployed at IIT
              Roorkee&apos;s Seismology Department, delivering real-time ground
              motion alerts before destructive shaking arrives.
            </p>

            <div className={styles.heroActions}>
              <button
                className={styles.btnPrimary}
                onClick={() => (window.location.href = "/map")}
              >
                <i className="ti ti-map" aria-hidden="true" />
                View Device Network
              </button>
              <button
                className={styles.btnGhost}
                onClick={() => (window.location.href = "#about")}
              >
                Learn More →
              </button>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.iitBadge}>
              <div className={styles.iitIcon}>
                <i className="ti ti-building-community" aria-hidden="true" />
              </div>
              <div>
                <div className={styles.iitTitle}>Incubated at IIIT Lucknow</div>
                <div className={styles.iitSub}>
                  InventisLabs is backed by IIIT Lucknow&apos;s incubation
                  programme — validating the science behind EEWS.
                </div>
              </div>
            </div>

            <div className={styles.statusCard}>
              <div className={styles.statusHeader}>
                <span className={styles.statusTitle}>
                  {FEATURED_DEVICE.id} // Device Status
                </span>
                <span className={styles.liveBadge}>
                  <span className={styles.liveDot} />
                  Live
                </span>
              </div>
              <div className={styles.statusRows}>
                {[
                  {
                    icon: "ti-map-pin",
                    key: "Location",
                    val: FEATURED_DEVICE.location,
                    cls: styles.valBlue,
                  },
                  {
                    icon: "ti-heart-rate-monitor",
                    key: "Heartbeat",
                    val: "Active",
                    cls: styles.valGreen,
                  },
                  {
                    icon: "ti-shield-check",
                    key: "Health",
                    val: FEATURED_DEVICE.health,
                    cls: styles.valGreen,
                  },
                  {
                    icon: "ti-antenna",
                    key: "Data Rate",
                    val: `${FEATURED_DEVICE.dataRate} intervals`,
                    cls: "",
                  },
                ].map((row, i) => (
                  <div key={i}>
                    <div className={styles.statusRow}>
                      <span className={styles.statusKey}>
                        <i className={`ti ${row.icon}`} aria-hidden="true" />
                        {row.key}
                      </span>
                      <span className={`${styles.statusVal} ${row.cls}`}>
                        {row.val}
                      </span>
                    </div>
                    {i < 3 && <div className={styles.statusDivider} />}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.statsRow}>
              {[
                { n: String(SITE.leadTimeSec), u: "sec", l: "Warning lead time" },
                { n: "24", u: "/7", l: "Continuous monitoring" },
                { n: "3", u: "-axis", l: "Accelerometer readings" },
              ].map((s, i) => (
                <div key={i} className={styles.stat}>
                  <div className={styles.statN}>
                    {s.n}
                    <em>{s.u}</em>
                  </div>
                  <div className={styles.statL}>{s.l}</div>
                </div>
              ))}
            </div>

            <div className={styles.indiaStrip}>
              <span className={styles.indiaFlag}>🇮🇳</span>
              <div className={styles.indiaTxt}>
                <strong>100% Indigenous Technology</strong>
                Designed, built, and deployed entirely in India.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.about} id="about">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>About InventisLabs</div>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutLeft}>
              <h2 className={styles.sectionTitle}>
                Research-driven innovation
                <br />
                <span className={styles.accent}>for a safer India</span>
              </h2>
              <p className={styles.aboutText}>
                InventisLabs is a deep-tech startup incubated at the Indian
                Institute of Information Technology, Lucknow ({SITE.incubator}).
              </p>
              <p className={styles.aboutText}>
                We build innovative, research-driven solutions to real-world
                problems. Our flagship product, the{" "}
                <strong>Earthquake Early Warning System (EEWS)</strong>, is
                India&apos;s first indigenously designed and manufactured
                seismic detection device — built entirely with local expertise.
              </p>
              <p className={styles.aboutText}>
                Our mission is to make early warning technology accessible,
                affordable, and deployable across India&apos;s seismically
                active zones — protecting millions with seconds of advance
                notice.
              </p>
            </div>
            <div className={styles.aboutRight}>
              {[
                {
                  icon: "ti-bulb",
                  color: "blue",
                  title: "Indigenous Innovation",
                  desc: "Designed and built entirely in India, reducing dependency on imported seismic monitoring equipment while keeping costs accessible for government deployment.",
                },
                {
                  icon: "ti-chart-line",
                  color: "green",
                  title: "Real-Time Detection",
                  desc: "Continuous 3-axis accelerometer readings processed with adaptive baseline algorithms to distinguish genuine seismic events from background noise.",
                },
                {
                  icon: "ti-building",
                  color: "amber",
                  title: "IIT Roorkee Validated",
                  desc: "Developed and field-tested in collaboration with the Seismology Department at IIT Roorkee — deployed on campus for live, continuous validation.",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className={`${styles.aboutCard} ${styles[`card_${card.color}`]}`}
                >
                  <div className={styles.aboutCardIcon}>
                    <i className={`ti ${card.icon}`} aria-hidden="true" />
                  </div>
                  <div>
                    <div className={styles.aboutCardTitle}>{card.title}</div>
                    <div className={styles.aboutCardDesc}>{card.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.how} id="device">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>How It Works</div>
          <h2 className={styles.sectionTitle}>
            From ground motion to alert
            <br />
            <span className={styles.accent}>in milliseconds</span>
          </h2>
          <div className={styles.steps}>
            {HOW_STEPS.map((step, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNum}>{step.num}</div>
                <div className={styles.stepIcon}>
                  <i className={`ti ${step.icon}`} aria-hidden="true" />
                </div>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepDesc}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.network} id="network">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabelLight}>Device Network</div>
          <h2 className={`${styles.sectionTitle} ${styles.titleLight}`}>
            Deployed &amp; monitored locations
          </h2>
          <div className={styles.networkGrid}>
            {DEVICES.map((d, i) => (
              <div
                key={i}
                className={`${styles.deviceCard} ${d.status === "live" ? styles.deviceCardLive : ""}`}
                tabIndex={0}
                onClick={() => (window.location.href = `/device/${d.id}`)}
              >
                <div className={styles.deviceCardHeader}>
                  <span className={styles.deviceId}>{d.id}</span>
                  <span
                    className={`${styles.deviceBadge} ${d.status === "live" ? styles.badgeLive : styles.badgeSim}`}
                  >
                    {d.statusLabel}
                  </span>
                </div>
                <div className={styles.deviceDetails}>
                  <div className={styles.deviceDetail}>
                    <i className="ti ti-map-pin" aria-hidden="true" />
                    <span>
                      <strong>{d.location}</strong>
                    </span>
                  </div>
                  <div className={styles.deviceDetail}>
                    <i className="ti ti-building" aria-hidden="true" />
                    <span>{d.dept}</span>
                  </div>
                  <div className={styles.deviceDetail}>
                    <i className="ti ti-compass" aria-hidden="true" />
                    <span>{d.coords}</span>
                  </div>
                  <div className={styles.deviceDetail}>
                    <i
                      className={`ti ${d.status === "live" ? "ti-activity" : "ti-clock"}`}
                      aria-hidden="true"
                    />
                    <span>{d.detail}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cta} id="contact">
        <div className={styles.sectionInner}>
          <div className={styles.ctaInner}>
            <div className={styles.ctaLeft}>
              <div className={styles.sectionLabel}>Get Started</div>
              <h2 className={styles.ctaTitle}>
                See the network
                <br />
                in action
              </h2>
              <p className={styles.ctaDesc}>
                Explore live seismic data from our deployed device and
                understand how EEWS protects communities in real time.
              </p>
              <div className={styles.ctaActions}>
                <button
                  className={styles.btnPrimary}
                  onClick={() => (window.location.href = "/map")}
                >
                  <i className="ti ti-map" aria-hidden="true" />
                  Open Device Map
                </button>
                <Link href="/contact" className={styles.btnGhost}>
                  Contact InventisLabs →
                </Link>
              </div>
            </div>
            <div className={styles.ctaRight}>
              {[
                {
                  icon: "ti-map-2",
                  title: "Interactive Map",
                  desc: "See all deployed and planned EEWS devices across India on a live map.",
                },
                {
                  icon: "ti-device-analytics",
                  title: "Device Dashboard",
                  desc: "Drill into individual device data — seismograph, health, accuracy.",
                },
                {
                  icon: "ti-bell-ringing",
                  title: "Real-Time Alerts",
                  desc: "Monitor live threshold alerts as seismic events are detected on the ground.",
                },
              ].map((item, i) => (
                <div key={i} className={styles.ctaCard}>
                  <div className={styles.ctaCardIcon}>
                    <i className={`ti ${item.icon}`} aria-hidden="true" />
                  </div>
                  <div>
                    <div className={styles.ctaCardTitle}>{item.title}</div>
                    <div className={styles.ctaCardDesc}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <div className={`${styles.logoMark} ${styles.logoMarkSm}`}>
              <div className={styles.logoBars}>
                {[5, 9, 13, 7, 10].map((h, i) => (
                  <span key={i} style={{ height: h }} />
                ))}
              </div>
            </div>
            <div>
              <div className={`${styles.logoName} ${styles.logoNameLight}`}>
                Inventis<span>Labs</span>
              </div>
              <div className={styles.footerIit}>Incubated at IIIT Lucknow</div>
            </div>
          </div>
          <div className={styles.footerText}>
            © {new Date().getFullYear()} InventisLabs · EQ-Alert v1.0 · India&apos;s
            first Indigenous Earthquake Early Warning System
          </div>
        </div>
      </footer>
    </main>
  );
}
