// ===============================
// SUPABASE CONFIGURATION
// ===============================

const SUPABASE_URL = "https://dqnjrxmzhlnubepxhedl.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_Z9XMSxukE9mT-0X4lIpfmQ_CheLYg7e";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ===============================
// DOM ELEMENTS
// ===============================

const landing = document.querySelector("#landing");
const auth = document.querySelector("#auth");
const workspace = document.querySelector("#workspace");

const navActions = document.querySelector("#navActions");

const loginContent = document.querySelector("#loginContent");
const signupContent = document.querySelector("#signupContent");

const toast = document.querySelector("#toast");

const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const editor = document.querySelector("#editor");
const preview = document.querySelector("#imagePreview");
const processing = document.querySelector("#processing");
const removeBg = document.querySelector("#removeBg");
const download = document.querySelector("#download");


// ===============================
// TOAST MESSAGE
// ===============================

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}


// ===============================
// SCREEN NAVIGATION
// ===============================

function showScreen(name) {
  [landing, auth, workspace].forEach((screen) => {
    screen.classList.remove("active");
  });

  // HOME
  if (name === "home") {
    landing.classList.add("active");
    navActions.hidden = false;
    return;
  }

  // WORKSPACE
  if (name === "workspace") {
    workspace.classList.add("active");
    navActions.hidden = true;
    return;
  }

  // AUTH
  auth.classList.add("active");
  navActions.hidden = false;

  loginContent.hidden = name !== "login";
  signupContent.hidden = name !== "signup";
}


// ===============================
// NAVIGATION BUTTONS
// ===============================

document.querySelectorAll("[data-screen]").forEach((button) => {
  button.addEventListener("click", () => {
    showScreen(button.dataset.screen);
  });
});


document.querySelector("#backToLanding").addEventListener("click", () => {
  showScreen("home");
});


// ===============================
// UPDATE USER UI
// ===============================

function updateUserUI(user) {
  if (!user) return;

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const firstName = fullName.split(" ")[0];

  const profileName = document.querySelector("#profileName");
  const welcomeName = document.querySelector("#welcomeName");
  const profilePic = document.querySelector(".profile-pic");

  if (profileName) {
    profileName.textContent = fullName;
  }

  if (welcomeName) {
    welcomeName.textContent = firstName;
  }

  if (profilePic) {
    profilePic.textContent = firstName[0].toUpperCase();
  }
}


// ===============================
// SIGN UP + LOGIN
// ===============================

document.querySelectorAll("[data-auth]").forEach((form) => {

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const authType = form.dataset.auth;

    // ---------------------------
    // GET FORM VALUES
    // ---------------------------

    const nameInput = form.querySelector('input[type="text"]');
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');

    const name = nameInput?.value.trim() || "";
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";


    // ---------------------------
    // BASIC VALIDATION
    // ---------------------------

    if (!email || !password) {
      showToast("Please enter your email and password.");
      return;
    }

    if (authType === "signup" && !name) {
      showToast("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters.");
      return;
    }


    // Disable submit button
    const submitButton = form.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
    }


    // ===========================
    // SIGN UP
    // ===========================

    if (authType === "signup") {

      try {

        const { data, error } = await supabaseClient.auth.signUp({
          email: email,
          password: password,

          options: {
            data: {
              full_name: name
            }
          }
        });


        if (error) {
          throw error;
        }


        // Email confirmation enabled
        if (data.user && !data.session) {

          showToast(
            "Account created! Please check your email to verify your account."
          );

          form.reset();

          if (submitButton) {
            submitButton.disabled = false;
          }

          return;
        }


        // Account created + automatically logged in
        if (data.user) {

          updateUserUI(data.user);

          showScreen("workspace");

          showToast("Your account has been created successfully!");
        }

      } catch (error) {

        console.error("SIGN UP ERROR:", error);

        showToast(error.message || "Unable to create account.");
      }

    }


    // ===========================
    // LOGIN
    // ===========================

    if (authType === "login") {

      try {

        const { data, error } =
          await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
          });


        if (error) {
          throw error;
        }


        if (data.user) {

          updateUserUI(data.user);

          showScreen("workspace");

          showToast("Welcome back!");
        }

      } catch (error) {

        console.error("LOGIN ERROR:", error);

        showToast(error.message || "Invalid email or password.");
      }
    }


    // Enable button again
    if (submitButton) {
      submitButton.disabled = false;
    }

  });

});


// ===============================
// CHECK EXISTING SESSION
// ===============================

async function checkUserSession() {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session?.user) {

    updateUserUI(session.user);

    showScreen("workspace");

  } else {

    showScreen("home");
  }
}

checkUserSession();


// ===============================
// AUTH STATE CHANGE
// ===============================

supabaseClient.auth.onAuthStateChange((event, session) => {

  if (session?.user) {

    updateUserUI(session.user);

  }

});


// ===============================
// CHOOSE IMAGE
// ===============================

document.querySelector("#chooseFile").addEventListener("click", () => {
  fileInput.click();
});


document.querySelector("#newImage").addEventListener("click", () => {
  fileInput.click();
});


// ===============================
// FILE INPUT
// ===============================

fileInput.addEventListener("change", (event) => {
  processFile(event.target.files[0]);
});


// ===============================
// DRAG & DROP
// ===============================

["dragenter", "dragover"].forEach((eventName) => {

  dropZone.addEventListener(eventName, (event) => {

    event.preventDefault();

    dropZone.classList.add("dragging");

  });

});


["dragleave", "drop"].forEach((eventName) => {

  dropZone.addEventListener(eventName, (event) => {

    event.preventDefault();

    dropZone.classList.remove("dragging");

  });

});


dropZone.addEventListener("drop", (event) => {

  processFile(event.dataTransfer.files[0]);

});


// ===============================
// PROCESS IMAGE
// ===============================

function processFile(file) {

  if (!file) return;


  // Check image
  if (!file.type.startsWith("image/")) {

    showToast("Please choose a JPG, PNG, or WEBP image.");

    return;
  }


  // 10 MB limit
  if (file.size > 10 * 1024 * 1024) {

    showToast("That file is over the 10 MB limit.");

    return;
  }


  preview.src = URL.createObjectURL(file);


  dropZone.hidden = true;

  editor.hidden = false;


  removeBg.disabled = false;

  download.disabled = true;


  document.querySelector(
    "#editorMessage"
  ).textContent = `${file.name} is ready for editing.`;

}


// ===============================
// REMOVE BACKGROUND
// ===============================

removeBg.addEventListener("click", () => {

  processing.hidden = false;

  removeBg.disabled = true;


  // TEMPORARY DEMO
  // Actual AI backend will be connected later.

  setTimeout(() => {

    processing.hidden = true;

    removeBg.disabled = false;

    download.disabled = false;


    document.querySelector(
      "#editorMessage"
    ).textContent =
      "Background removal is complete. Download your HD image.";


    showToast("Background removed successfully!");

  }, 1800);

});


// ===============================
// DOWNLOAD
// ===============================

download.addEventListener("click", () => {

  showToast(
    "Your HD image download will begin when the AI service is connected."
  );

});


// ===============================
// PROFILE MENU
// ===============================

const profileButton = document.querySelector("#profileButton");
const profileMenu = document.querySelector("#profileMenu");
const logoutButton = document.querySelector("#logoutButton");


// Open / close profile menu
profileButton.addEventListener("click", (event) => {

  event.stopPropagation();

  profileMenu.hidden = !profileMenu.hidden;

});


// Logout
logoutButton.addEventListener("click", async (event) => {

  event.stopPropagation();

  const { error } = await supabaseClient.auth.signOut();

  if (error) {

    console.error("LOGOUT ERROR:", error);

    showToast("Unable to logout.");

    return;
  }

  profileMenu.hidden = true;

  showToast("Logged out successfully.");

  showScreen("home");

});


// Close menu when clicking outside
document.addEventListener("click", () => {

  if (profileMenu) {
    profileMenu.hidden = true;
  }

});