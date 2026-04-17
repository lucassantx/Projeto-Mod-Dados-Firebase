# VAULT — Verificação e Autenticação de Usuários em Levels Táticos

Aplicação web com autenticação e controle de acesso baseado em cargos usando Firebase Authentication e Realtime Database.

---

## Estrutura do Projeto

```
vault/
├── index.html           # Interface visual da aplicação
├── app.js               # Lógica de autenticação e leitura do banco
├── style.css            # Estilização
└── database-rules.json  # Security Rules do Firebase
```

---

## Modelagem do Banco de Dados

O banco é dividido em três nós principais:

```json
{
  "users": {
    "{uid}": {
      "name": "Nome do usuário",
      "email": "email@exemplo.com",
      "role": "admin"
    }
  },
  "admin-data": {
    "reports": {
      "r1": { "title": "Relatório Q1", "value": 9800 },
      "r2": { "title": "Relatório Q2", "value": 14250 }
    },
    "settings": {
      "maintenanceMode": false,
      "totalUsers": 42
    }
  },
  "public-data": {
    "announcements": {
      "a1": { "title": "Sistema online", "body": "Acesso disponível para todos os usuários." },
      "a2": { "title": "Versão atual", "body": "Atualizado em Abril de 2026." }
    }
  }
}
```

| No | Descrição |
|---|---|
| `/users/{uid}` | Dados do usuário com o campo `role` definindo o cargo |
| `/admin-data` | Relatórios e configurações restritos ao cargo admin |
| `/public-data` | Avisos visíveis para qualquer usuário autenticado |

---

## Firebase Security Rules

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read":  "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "admin-data": {
      ".read":  "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    },
    "public-data": {
      ".read":  "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    }
  }
}
```

Resumo das permissões:

| No | User | Admin |
|---|---|---|
| `/users/{uid}` | Lê e escreve apenas o próprio | Lê e escreve apenas o próprio |
| `/admin-data` | Bloqueado | Liberado |
| `/public-data` | Leitura | Leitura e escrita |

---

## Autenticação e Cargo

O cargo é definido no momento do cadastro e salvo no banco sob o nó `/users/{uid}`:

```js
await set(ref(db, `users/${uid}`), {
  name:  nome,
  email: email,
  role:  cargo
});
```

Após o login, o sistema lê o campo `role` do banco e renderiza a interface de acordo com o cargo. Caso um usuário com cargo `user` tente acessar `/admin-data`, o Firebase rejeita a leitura pelas Security Rules e a interface exibe a mensagem `PERMISSION_DENIED`.

---

## Interface

A aplicação possui duas telas.

**Login e Cadastro** — formulário com seleção de cargo no momento do cadastro.

**Dashboard** — exibe o cargo do usuário na barra superior, painel de dados públicos visível para todos os cargos, painel administrativo restrito ao admin com bloqueio visual explícito para o cargo user, e painel de perfil com os dados do usuário logado.

---

## Como Rodar

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/vault.git
cd vault
```

2. Abra a pasta no VS Code

3. Clique com botão direito em `index.html` e selecione Open with Live Server

4. Acesse `http://127.0.0.1:5500` no navegador

---

## Como Testar os Dois Cargos

1. Cadastre uma conta com cargo admin
2. Abra uma aba anônima e acesse o mesmo endereço
3. Cadastre uma conta com cargo user
4. Compare as duas abas — o admin acessa a área administrativa, o user recebe bloqueio com `PERMISSION_DENIED`

---

## Tecnologias

- Firebase Authentication
- Firebase Realtime Database
- HTML, CSS e JavaScript puro
- VS Code + Live Server
