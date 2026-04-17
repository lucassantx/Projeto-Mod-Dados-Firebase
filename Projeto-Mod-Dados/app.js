import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, set, get }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0WMMeXHREiRfhxod8haYU2yetKJ9Ja5U",
  authDomain: "projeto-mod-dados.firebaseapp.com",
  databaseURL: "https://projeto-mod-dados-default-rtdb.firebaseio.com",
  projectId: "projeto-mod-dados",
  storageBucket: "projeto-mod-dados.firebasestorage.app",
  messagingSenderId: "444607005318",
  appId: "1:444607005318:web:c7d34e827cd148deca8707"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

window.fazerCadastro = async () => {
  const nome  = document.getElementById("cad-nome").value.trim();
  const email = document.getElementById("cad-email").value.trim();
  const senha = document.getElementById("cad-senha").value;
  const cargo = document.getElementById("cad-cargo").value;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    await set(ref(db, `users/${cred.user.uid}`), { name: nome, email, role: cargo });
    await popularDadosExemplo();
  } catch (e) {
    document.getElementById("auth-erro").textContent = traduzirErro(e.code);
  }
};

window.fazerLogin = async () => {
  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;

  try {
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (e) {
    document.getElementById("auth-erro").textContent = traduzirErro(e.code);
  }
};

window.fazerLogout = () => signOut(auth);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("auth-screen").style.display = "none";
    document.getElementById("dashboard").style.display   = "block";
    await carregarDashboard(user.uid);
  } else {
    document.getElementById("auth-screen").style.display = "flex";
    document.getElementById("dashboard").style.display   = "none";
  }
});

async function carregarDashboard(uid) {
  const snap   = await get(ref(db, `users/${uid}`));
  const perfil = snap.val();
  const cargo  = perfil.role;

  document.getElementById("user-nome").textContent  = perfil.name;
  document.getElementById("user-badge").textContent = cargo.toUpperCase();
  document.getElementById("user-badge").className   = `cargo-tag ${cargo}`;

  document.getElementById("dados-perfil").innerHTML = `
    <div class="row"><span class="row-label">Nome</span><span class="row-value">${perfil.name}</span></div>
    <div class="row"><span class="row-label">E-mail</span><span class="row-value">${perfil.email}</span></div>
    <div class="row"><span class="row-label">Cargo</span><span class="row-value">${perfil.role}</span></div>
    <div class="row"><span class="row-label">UID</span><span class="row-value mono">${uid}</span></div>
  `;

  try {
    const pubSnap  = await get(ref(db, "public-data/announcements"));
    const anuncios = pubSnap.val();
    let html = "";
    for (const k in anuncios) {
      html += `<div class="row"><span class="row-label">Aviso</span><span class="row-value">${anuncios[k].title} — ${anuncios[k].body}</span></div>`;
    }
    document.getElementById("dados-publicos").innerHTML = html;
  } catch (e) {
    document.getElementById("dados-publicos").innerHTML = `<span style="color:#e3000f;font-size:.82rem">${e.message}</span>`;
  }

  if (cargo === "admin") {
    document.getElementById("badge-admin").textContent = "Liberado";
    document.getElementById("badge-admin").className   = "status status-ok";

    try {
      const adminSnap = await get(ref(db, "admin-data"));
      const d         = adminSnap.val();
      document.getElementById("dados-admin").innerHTML = `
        <div class="row"><span class="row-label">Relatorio Q1</span><span class="row-value">R$ ${d.reports.r1.value.toLocaleString("pt-BR")}</span></div>
        <div class="row"><span class="row-label">Relatorio Q2</span><span class="row-value">R$ ${d.reports.r2.value.toLocaleString("pt-BR")}</span></div>
        <div class="row"><span class="row-label">Manutencao</span><span class="row-value">${d.settings.maintenanceMode ? "Ativa" : "Inativa"}</span></div>
        <div class="row"><span class="row-label">Usuarios</span><span class="row-value">${d.settings.totalUsers}</span></div>
      `;
    } catch (e) {
      document.getElementById("dados-admin").innerHTML = `<span style="color:#e3000f;font-size:.82rem">${e.message}</span>`;
    }

  } else {
    document.getElementById("badge-admin").textContent = "Bloqueado";
    document.getElementById("badge-admin").className   = "status status-blocked";

    document.getElementById("dados-admin").innerHTML = `
      <div class="bloqueio">
        <span class="bloqueio-titulo">Acesso negado</span>
        <span class="bloqueio-desc">Seu cargo nao tem permissao para esta area.</span>
        <span class="bloqueio-code">PERMISSION_DENIED — /admin-data</span>
      </div>
    `;
  }
}

async function popularDadosExemplo() {
  const snap = await get(ref(db, "public-data"));
  if (snap.exists()) return;

  await set(ref(db, "public-data/announcements"), {
    a1: { title: "Sistema online", body: "Acesso disponivel para todos os usuarios." },
    a2: { title: "Versao atual",   body: "Atualizado em Abril de 2026." }
  });

  await set(ref(db, "admin-data"), {
    reports:  {
      r1: { title: "Relatorio Q1", value: 9800  },
      r2: { title: "Relatorio Q2", value: 14250 }
    },
    settings: { maintenanceMode: false, totalUsers: 42 }
  });
}

window.showTab = (tab) => {
  document.getElementById("tab-login").style.display    = tab === "login"    ? "flex" : "none";
  document.getElementById("tab-cadastro").style.display = tab === "cadastro" ? "flex" : "none";
  document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
  document.querySelector(`.tab:${tab === "login" ? "first" : "last"}-child`).classList.add("active");
  document.getElementById("auth-erro").textContent = "";
};

function traduzirErro(code) {
  const map = {
    "auth/email-already-in-use": "Este e-mail ja esta cadastrado.",
    "auth/invalid-email":        "E-mail invalido.",
    "auth/weak-password":        "Senha fraca. Minimo 6 caracteres.",
    "auth/invalid-credential":   "E-mail ou senha incorretos.",
    "auth/user-not-found":       "Usuario nao encontrado.",
    "auth/wrong-password":       "Senha incorreta.",
  };
  return map[code] || "Erro: " + code;
}