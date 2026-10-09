import { useEffect, useRef, useState } from "react";

import { createClient } from "@supabase/supabase-js";
import "./styles.css";
import heroImage from "./assets/hero1.webp";

// ===============================
// SUPABASE
// ===============================

const SUPABASE_URL = "https://dqnjrxmzhlnubepxhedl.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_Z9XMSxukE9mT-0X4lIpfmQ_CheLYg7e";

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// ===============================
// APP
// ===============================

function App() {

  const [screen, setScreen] = useState("home");
  const [authMode, setAuthMode] = useState("login");

  const [user, setUser] = useState(null);

  const [profileMenu, setProfileMenu] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [processing, setProcessing] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  const [toast, setToast] = useState("");

  const fileInputRef = useRef(null);


  // ===============================
  // TOAST
  // ===============================

  const showToast = (message) => {

    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3200);

  };
  async function handleGoogleLogin() {
    console.log("Starting Google Login...");

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      console.error("Google Login Error:", error);
      showToast(error.message);
    }
  }
  

  // ===============================
  // SESSION
  // ===============================
  useEffect(() => {
    async function loadSession() {
      console.log("=== CHECKING SESSION ===");

      const {
        data: { session },
        error,
      } = await supabaseClient.auth.getSession();

      console.log("SESSION:", session);
      console.log("SESSION ERROR:", error);
      console.log("CURRENT URL:", window.location.href);

      if (session?.user) {
        console.log("USER FOUND → OPENING WORKSPACE");
        console.log("GOOGLE USER DATA:", session.user);
        console.log("USER METADATA:", session.user.user_metadata);
        console.log("IDENTITIES:", session.user.identities);
        setUser(session.user);
        setScreen("workspace");
      } else {
        console.log("NO USER → HOME");

        setUser(null);
        setScreen("home");
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log("=== AUTH EVENT ===");
      console.log("EVENT:", event);
      console.log("SESSION:", session);
      console.log("URL:", window.location.href);

      if (session?.user) {
        console.log("AUTH USER FOUND → WORKSPACE");

        setUser(session.user);
        setScreen("workspace");
      } else {
        console.log("AUTH USER NOT FOUND");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkSession() {

    const {
      data: { session }
    } = await supabaseClient.auth.getSession();

    if (session?.user) {

      setUser(session.user);
      setScreen("workspace");

    } else {

      setScreen("home");

    }

  }


  // ===============================
  // USER DETAILS
  // ===============================

  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const firstName = fullName.split(" ")[0];

  const firstLetter =
    firstName.charAt(0).toUpperCase();

  const avatarUrl =
  user?.user_metadata?.avatar_url ||
  user?.user_metadata?.picture ||
  user?.identities?.[0]?.identity_data?.avatar_url ||
  user?.identities?.[0]?.identity_data?.picture ||
  "";

  // ===============================
  // NAVIGATION
  // ===============================

  const goToAuth = (mode) => {

    setAuthMode(mode);
    setScreen("auth");

  };


  // ===============================
  // SIGN UP
  // ===============================

  async function handleSignup(event) {

    event.preventDefault();

    const form = event.currentTarget;

    const name =
      form.elements.fullName.value.trim();

    const email =
      form.elements.email.value.trim();

    const password =
      form.elements.password.value;


    if (!name || !email || !password) {

      showToast("Please fill all fields.");
      return;

    }


    if (password.length < 8) {

      showToast(
        "Password must be at least 8 characters."
      );

      return;

    }


    const button =
      form.querySelector("button[type='submit']");

    if (button) {
      button.disabled = true;
    }


    const { data, error } =
      await supabaseClient.auth.signUp({

        email,
        password,

        options: {

          data: {
            full_name: name
          }

        }

      });


    if (error) {

      console.error(error);

      showToast(error.message);

      if (button) {
        button.disabled = false;
      }

      return;

    }


    if (data.user && !data.session) {

      showToast(
        "Account created! Please check your email."
      );

      form.reset();

    } else if (data.user) {

      setUser(data.user);
      setScreen("workspace");

      showToast(
        "Your account has been created successfully!"
      );

    }


    if (button) {
      button.disabled = false;
    }

  }


  // ===============================
  // LOGIN
  // ===============================

  async function handleLogin(event) {

    event.preventDefault();

    const form = event.currentTarget;

    const email =
      form.elements.email.value.trim();

    const password =
      form.elements.password.value;


    if (!email || !password) {

      showToast(
        "Please enter your email and password."
      );

      return;

    }


    const button =
      form.querySelector("button[type='submit']");

    if (button) {
      button.disabled = true;
    }


    const { data, error } =
      await supabaseClient.auth.signInWithPassword({

        email,
        password

      });


    if (error) {

      console.error(error);

      showToast(error.message);

      if (button) {
        button.disabled = false;
      }

      return;

    }


    if (data.user) {

      setUser(data.user);
      setScreen("workspace");

      showToast("Welcome back!");

    }


    if (button) {
      button.disabled = false;
    }

  }


  // ===============================
  // LOGOUT
  // ===============================

  async function handleLogout() {
  await supabaseClient.auth.signOut({
    scope: "local",
  });

  setUser(null);
  setScreen("home");
  setProfileMenu(false);

  setSelectedFile(null);
  setPreview("");
  setDownloadReady(false);

  showToast("Logged out successfully.");
}


  // ===============================
  // IMAGE SELECT
  // ===============================

  function openFilePicker() {

    fileInputRef.current?.click();

  }


  function processFile(file) {

    if (!file) return;


    if (!file.type.startsWith("image/")) {

      showToast(
        "Please choose a JPG, PNG, or WEBP image."
      );

      return;

    }


    if (file.size > 10 * 1024 * 1024) {

      showToast(
        "That file is over the 10 MB limit."
      );

      return;

    }


    setSelectedFile(file);

    setPreview(
      URL.createObjectURL(file)
    );

    setDownloadReady(false);

  }


  function handleFileChange(event) {

    processFile(event.target.files[0]);

  }

async function removeBackground() {
  if (!selectedFile) {
    showToast("Please select an image first.");
    return;
  }

  setProcessing(true);
  setDownloadReady(false);

  try {
    const formData = new FormData();

    formData.append("image", selectedFile);


    const response = await fetch(
      "https://erasely-backend.onrender.com/api/remove-background",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Background removal failed."
      );
    }

    console.log("AI backend response:", data);

    if (!data.outputUrl) {
      throw new Error(
        "Processed image URL was not received."
      );
    }

    // Keep original image in preview
    // Store processed image separately
    setPreview(data.outputUrl);

    setProcessing(false);
    setDownloadReady(true);

    showToast("Background removed successfully!");
  } catch (error) {
    console.error(
      "Background removal error:",
      error
    );

    setProcessing(false);
    setDownloadReady(false);

    showToast(
      error.message ||
        "Something went wrong."
    );
  }
}

async function handleDownload() {
  if (!preview || !downloadReady) {
    return;
  }

  try {
    const response = await fetch(
      preview
    );

    if (!response.ok) {
      throw new Error(
        "Could not download the processed image."
      );
    }

    const blob = await response.blob();

    const blobUrl =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = blobUrl;
    link.download =
      "erasely-no-background.png";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);

    showToast(
      "Image downloaded successfully!"
    );

  } catch (error) {
    console.error(
      "Download error:",
      error
    );

    showToast(
      "Unable to download the image."
    );
  }
}



  // ===============================
  // HOME
  // ===============================

  if (screen === "home") {

    return (

      <>

        <div className="ambient ambient-one"></div>
        <div className="ambient ambient-two"></div>


        <main className="app-shell">

          <nav className="nav">

            <a
              className="brand"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setScreen("home");
              }}
            >

              <span className="brand-mark">
                <i></i>
                <i></i>
                <i></i>
              </span>

              <span>
                erase<span>ly</span>
              </span>

            </a>


            <div className="nav-actions">

              <button
                className="text-button"
                onClick={() => goToAuth("login")}
              >
                Log in
              </button>


              <button
                className="small-primary"
                onClick={() => goToAuth("signup")}
              >
                Get started <span>→</span>
              </button>

            </div>

          </nav>


          <section
            id="landing"
            className="screen active"
          >

            <div className="hero-copy">

              <div className="eyebrow">

                <span className="spark">
                  ✦
                </span>

                AI-powered editing, made simple

              </div>


              <h1>

                Make every image
                <br />

                <em>stand out.</em>

              </h1>


              <p>

                Transform simple images into stunning visuals.
                <br />

                No Photoshop. No manual selections. Just instant results.

              </p>


              <div className="hero-buttons">

                <button
                  className="primary-button"
                  onClick={() => goToAuth("signup")}
                >

                  Remove a background
                  <span>→</span>

                </button>


                <button
                  className="play-button"
                  onClick={() =>
                    showToast("Demo video coming soon.")
                  }
                >

                  <span className="play">
                    ▶
                  </span>

                  See how it works

                </button>

              </div>


              <div className="trust">

                <div className="avatars">

                  <span>J</span>
                  <span>M</span>
                  <span>A</span>
                  <span>+</span>

                </div>


                <span>

                  Loved by <strong>10,000+</strong> creators

                </span>

              </div>

            </div>


            <HeroArt />

          </section>

        </main>


        {toast && (
          <div className="toast show">
            {toast}
          </div>
        )}

      </>

    );

  }


  // ===============================
  // AUTH
  // ===============================

  if (screen === "auth") {

    return (

      <>

        <div className="ambient ambient-one"></div>
        <div className="ambient ambient-two"></div>


        <main className="app-shell">

          <nav className="nav">

            <a
              className="brand"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setScreen("home");
              }}
            >

              <span className="brand-mark">
                <i></i>
                <i></i>
                <i></i>
              </span>

              <span>
                erase<span>ly</span>
              </span>

            </a>

          </nav>


          <section 
            id="auth" 
            className="screen auth-screen active" 
          >

            <button
              className="back-button"
              onClick={() => setScreen("home")}
            >
              ← Back
            </button>


            <div className="auth-card">

              <div className="auth-icon">
                ✦
              </div>


              {authMode === "login" ? (

                <>

                  <p className="auth-kicker">
                    Welcome back
                  </p>

                  <h2>
                    Log in to Erasely
                  </h2>

                  <p className="auth-subtitle">
                    Continue creating amazing images.
                  </p>


                  <form
                    className="auth-form"
                    onSubmit={handleLogin}
                  >

                    <label>

                      Email address

                      <input
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                      />

                    </label>


                    <label>

                      Password

                      <input
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                      />

                    </label>


                    <div className="form-row">

                      <label className="check-label">

                        <input type="checkbox" />

                        <span>
                          Remember me
                        </span>

                      </label>


                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          showToast(
                            "Password reset will be added soon."
                          );
                        }}
                      >
                        Forgot password?
                      </a>

                    </div>


                    <button
                      className="primary-button full"
                      type="submit"
                    >

                      Log in
                      <span>→</span>

                    </button>

                  </form>


                  <p className="switch-auth">

                    New to Erasely?

                    <button
                      onClick={() => setAuthMode("signup")}
                    >
                      Create an account
                    </button>

                  </p>

                </>

              ) : (

                <>

                  <p className="auth-kicker">
                    Start for free
                  </p>

                  <h2>
                    Create your account
                  </h2>

                  <p className="auth-subtitle">
                    Your first 3 removals are on us.
                  </p>


                  <form
                    className="auth-form"
                    onSubmit={handleSignup}
                  >

                    <label>

                      Full name

                      <input
                        name="fullName"
                        type="text"
                        placeholder="Your name"
                        required
                      />

                    </label>


                    <label>

                      Email address

                      <input
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                      />

                    </label>


                    <label>

                      Create password

                      <input
                        name="password"
                        type="password"
                        placeholder="At least 8 characters"
                        minLength="8"
                        required
                      />

                    </label>


                    <button
                      className="primary-button full"
                      type="submit"
                    >

                      Create free account
                      <span>→</span>

                    </button>

                  </form>


                  <p className="switch-auth">
                    Already have an account?

                    <button
                      onClick={() => setAuthMode("login")}
                    >
                      Log in
                    </button>
                  </p>


                  {/* SOCIAL LOGIN OPTIONS */}
                </>

              )}

            </div>

          </section>

        </main>


        {toast && (
          <div className="toast show">
            {toast}
          </div>
        )}

      </>

    );

  }


  // ===============================
  // WORKSPACE
  // ===============================

  return (

    <>

      <section
        id="workspace"
        className="screen workspace-screen active"
      >

        <aside className="sidebar">

          <a
            className="brand"
            href="#"
            onClick={(e) => e.preventDefault()}
          >

            <span className="brand-mark">
              <i></i>
              <i></i>
              <i></i>
            </span>

            <span>
              erase<span>ly</span>
            </span>

          </a>


          <div className="side-links">

            <button className="side-link selected">
              ⌂ <span>New removal</span>
            </button>

            <button
              className="side-link"
              onClick={() =>
                showToast("My images coming soon.")
              }
            >
              ▣ <span>My images</span>
            </button>

          </div>


          <div className="upgrade">

            <span>✦</span>

            <strong>
              More creative power
            </strong>

            <p>
              Get unlimited HD exports.
            </p>

            <button
              onClick={() =>
                showToast("Upgrade plan coming soon.")
              }
            >
              Upgrade plan
            </button>

          </div>


          <div style={{ position: "relative" }}>

            <button
              className="profile"
              onClick={() =>
                setProfileMenu(!profileMenu)
              }
            >

              <span className="profile-pic">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="profile-avatar"
                  />
                ) : (
                  firstLetter
                )}
              </span>

              <span>

                <strong>
                  {fullName}
                </strong>

                <small>
                  Free plan
                </small>

              </span>


              <b>
                •••
              </b>

            </button>


            {profileMenu && (

              <div
                style={{
                  position: "absolute",
                  bottom: "58px",
                  right: "5px",
                  width: "150px",
                  background: "#fff",
                  border: "1px solid #ebe9f5",
                  borderRadius: "10px",
                  padding: "7px",
                  boxShadow:
                    "0 15px 35px rgba(40,30,90,.15)",
                  zIndex: 50
                }}
              >

                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    border: "0",
                    background: "transparent",
                    padding: "10px",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#d34b5d",
                    fontFamily: "DM Sans"
                  }}
                >
                  Logout
                </button>

              </div>

            )}

          </div>

        </aside>


        <div className="workspace-main">

          <header className="workspace-header">

            <div>

              <p className="welcome">
                <span className="welcome-hello">Hello</span>,{" "}
                <span className="welcome-name">{firstName}</span>{" "}
                <span className="welcome-star">✦</span>
              </p>


              <h2>
                What are we creating today?
              </h2>

            </div>


            <button
              className="help"
              onClick={() =>
                showToast("Help center coming soon.")
              }
            >
              ? <span>Help center</span>
            </button>

          </header>


          {!selectedFile ? (

            <section
              className="upload-panel"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add(
                  "dragging"
                );
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove(
                  "dragging"
                );
              }}
              onDrop={(e) => {

                e.preventDefault();

                e.currentTarget.classList.remove(
                  "dragging"
                );

                processFile(
                  e.dataTransfer.files[0]
                );

              }}
            >

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={handleFileChange}
              />


              <div className="upload-icon">
                <span>↑</span>
              </div>


              <h3>
                Drop your image here
              </h3>


              <p>
                or choose a file from your computer
              </p>


              <button
                className="choose-button"
                onClick={openFilePicker}
              >
                Choose image
              </button>


              <small>
                Supports JPG, PNG and WEBP · Max 10 MB
              </small>

            </section>

          ) : (

            <section className="editor">

              <div className="editor-title">

                <div>

                  <p className="eyebrow mini">
                    Your image
                  </p>

                  <h3>
                    Ready to remove the background?
                  </h3>

                </div>


                <button
                  className="outline-button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview("");
                  setDownloadReady(false);
                }}
                >
                  Change image
                </button>

              </div>


              <div className="image-stage">

                <div className="checkerboard">

                  <img
                    src={preview}
                    alt="Uploaded"
                  />

                </div>

                {processing && (

                  <div className="processing">

                    <div className="loader"></div>

                    <strong>
                      Our AI is working its magic…
                    </strong>

                    <span>
                      This only takes a moment
                    </span>

                  </div>

                )}

              </div>

              <div className="editor-actions">

                <button
                  className="outline-button"
                  disabled={processing}
                  onClick={removeBackground}
                >
                  ✦ Remove background
                </button>


                <button
                  className="primary-button"
                  disabled={!downloadReady}
                  onClick={handleDownload}
                >
                  Download HD
                  <span>↓</span>
                </button>

              </div>


              <p className="editor-message">

                {downloadReady
                  ? "Background removal is complete. Download your HD image."
                  : `${selectedFile.name} is ready for editing.`}

              </p>

            </section>

          )}


          <section className="tips">

            <div>

              <span>✦</span>

              <p>
                <strong>Tip:</strong> Images with a clear subject work best.
              </p>

            </div>


            <div>

              <span>⌁</span>

              <p>
                <strong>Fast & private:</strong> Your images are never shared.
              </p>

            </div>


            <div>

              <span>◈</span>

              <p>
                <strong>High quality:</strong> Export up to HD resolution.
              </p>

            </div>

          </section>

        </div>

      </section>


      {toast && (
        <div className="toast show">
          {toast}
        </div>
      )}

    </>

  );

}


// ===============================
// HERO ART COMPONENT
// ===============================

function HeroArt() {
  return (
    <div className="hero-art">
      <img
        src={heroImage}
        alt="Erasely AI Background Remover"
        className="hero-image"
      />
    </div>
  );
}


export default App;
