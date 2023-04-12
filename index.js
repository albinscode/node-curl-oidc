const axios = require('axios')
const config = require('./config.json')
const axiosConfig = {
  headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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
function passwordGrantRun() {

    const data = `'grant_type=password&username=${config.user}&password=${config.password}&client_id=${config.clientId}&client_secret=${config.clientSecret}&scope=${config.scopes}'`
    console.log(`curl -d ${data} -H 'Content-Type: application/x-www-form-urlencoded' -X POST ${config.url}/token`)

    // on passe alors le access token à l'application
    // curl \
// -H "Authorization: Bearer
// c317ac0dd5393d0c908fc32d34d13c07951c3facc54c30a85faf7878fdc8b3fc" \
// -H "Content-Type: application/json" \
// -H "Accept: application/json" \
// -X GET https://annuaire-recette.anah.fr/v2/servicesTypes
}

passwordGrantRun()
