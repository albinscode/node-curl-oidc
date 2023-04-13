const axios = require('axios')
const config = require('./config.json')
const axiosConfig = {
  headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // 'Cookie': 'lemonldap=5815c7b378e8bed391c94af64a05b973ee683eaa1c02f9162dc27a1c237fe507',
      // 'Access-Control-Allow-Origin': "*",
      // 'Access-Control-Expose-Headers': 'Access-Token, Uid',
  }
}

// pour autoriser les certificats autosignés
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
    // connexion oidc au lemon ldap (portail sso)
    // il faut désactiver le jeton de protection csrf pour les accès API, cf
    // "Paramètres avancés / sécurité / exiger un jeton pour les formulaires" $env->{HTTP_ACCEPT} !~ m:application/json:
    // https://www.rfc-editor.org/rfc/rfc6749.html#section-4.3
    try {
        let result = await axios.post(`${config.url}?user=${config.user}&password=${config.password}`, {
        }, axiosConfig)

        if (!result.data.id) throw new Error('Session lemonldap non récupérée')
        console.log(result.data.id)
        const lemonldapSession = result.data.id
        // un code pkce peut être nécessaire selon le portail
        result = await axios.get(`${config.url}/authorize?response_type=code&client_id=${config.clientId}&scope=openid+profile+email&redirect_uri=${config.redirectUri}`,
            {
                headers: {
                    ...axiosConfig.headers,
                    Cookie: `lemonldap=${lemonldapSession}`,
                }
            }
        )
        // console.log(result.data)
        // console.log(result)
        console.log(result.request.res)

    }
    catch (e) {
        console.log(e.response.status)
        console.log(e.response.statusText)
        console.log(e.config.headers)
        console.log(e.config)

    }
}

// run()

// permet de générer la commande curl permettant de faire un grant_type de type password
// cela évite de faire toute la chaîne du code workflow, utile avec SPA, mais lourd avec
// la consommation pur API (backend sans frontend)
// cf lldap : https://lemonldap-ng.org/documentation/2.0/idpopenidconnect.html#resource-owner-password-grant
// il faut autoriser le password grant avec : "Clients OIDC / mon_client / options / sécurité / autoriser le password grant"
async function passwordGrantRun() {
    try {

        // const data = `'grant_type=password&username=${config.user}&password=${config.password}&client_id=${config.clientId}&client_secret=${config.clientSecret}&scope=${config.scopes}'`
        const data = `grant_type=password&username=${config.user}&password=${config.password}&client_id=${config.clientId}&scope=${config.scopes}`
        console.log(`curl -d '${data}' -H 'Content-Type: application/x-www-form-urlencoded' -X POST ${config.url}/token`)

        let result = await axios.post(`${config.url}/token?${data}`, {
        }, axiosConfig)
        console.log(result.data)

        // on passe alors le access token à l'application
        console.log(`curl -H 'Authorization: Bearer ${result.data.access_token}' -H 'Content-Type: application/json' -H 'Accept: application/json' -X GET ${config.applicationServiceTest}`)
        let result2 = await axios.get(`${config.applicationServiceTest}`,
        {
            headers: {
                ...axiosConfig.headers,
                Authorization: `Bearer ${result.data.access_token}`,
            }
        })
        console.log(result2.data)

    }
    catch (e) {
        console.log(e.config)
        console.log(e.response.status)
        console.log(e.response.statusText)
    }
}

passwordGrantRun()
