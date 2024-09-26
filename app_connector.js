const {
  HttpUtils,
  HttpUtils: { request, successResponse, errorResponse },
  STATUS,
} = require("quickwork-adapter-cli-server/http-library");


const app = {
    name : "constant_contact",
    alias : "constant_contact",
    description : "constant_contact",
    version : "1",
    config : {"authType":"oauth_2"},
    webhook_verification_required : false,
    internal : false,
    connection : {
        client_id : "06a872d9-c298-4670-a4e4-0fe4c4c324d3",
        client_secret : "-TtGc2GyfOm1XZ3CeL27Bw",
        redirect_uri : "https://proxy.quickwork.co.in/constant_contact/code",
        authorization: {
            type: "oauth_2",
            authorization_url: async connection => {
              let scope = [
                "account_read", "account_update", "contact_data", "offline_access", "campaign_data"
              ].join(" ");
              let url = `https://authz.constantcontact.com/oauth2/default/v1/authorize?client_id=${app.connection.client_id}&redirect_uri=${app.connection.redirect_uri}&response_type=code&scope=${scope}&state=${connection.id}`
              return { url: url };
            },
            acquire: async (code, scope, state) => {
            try {

                let tokenURL = "https://authz.constantcontact.com/oauth2/default/v1/token";

                let body = {
                  grant_type: "authorization_code",
                  code,
                  redirect_uri: app.connection.redirect_uri,
                }

                let encodedCredentials = Buffer.from(`${app.connection.client_id}:${app.connection.client_secret}`).toString('base64');

                let headers = {
                  Authorization: `Basic ${encodedCredentials}`,
                };
                
                let response = await request(
                  tokenURL,
                  headers,
                  null,
                  HttpUtils.HTTPMethods.POST,
                  body,
                  HttpUtils.ContentTypes.FORM_URL_ENCODED
                );
              
                if (response.success == true) {
                  let jsonResponse = JSON.parse(response.body);
                    return HttpUtils.successResponse({
                      accessToken: jsonResponse.access_token,
                      expires: jsonResponse.expires_in,
                      refreshToken: jsonResponse.refresh_token,
                    });
                  } else {
                    return HttpUtils.errorResponse(
                      userInfoResponse.body,
                      userInfoResponse.statusCode
                    );
                }
              } catch (error) {
                return HttpUtils.errorResponse(error.message);
              }
            },
            
            
            refresh: async connection => {
              try {
                let url = "https://authz.constantcontact.com/oauth2/default/v1/token";
            
                let body = {
                  refresh_token: connection.oauthToken.refreshToken,
                  grant_type: "refresh_token",
                };
            
                const encodedCredentials = Buffer.from(`${app.connection.client_id}:${app.connection.client_secret}`).toString('base64');
            
                const headers = {
                  Authorization: `Basic ${encodedCredentials}`,
                };
            
                let response = await HttpUtils.request(
                  url,
                  headers,
                  null,
                  HttpUtils.HTTPMethods.POST,
                  body,
                  HttpUtils.ContentTypes.FORM_URL_ENCODED
                );
                if (response.success == true) {
                  let jsonResponse = JSON.parse(response.body);
                    return HttpUtils.successResponse({
                      accessToken: jsonResponse.access_token,
                      expires: jsonResponse.expires_in,
                      refreshToken: jsonResponse.refresh_token,
                    });
                  } else {
                  return HttpUtils.errorResponse(response.body, response.statusCode);
                }
              } catch (error) {
                return HttpUtils.errorResponse(error.message);
              }
            },
            
            refresh_on: [401],
            detect_on: "",
            credentials: connection => {
              let headers = {};
              headers['Authorization'] = `Bearer ${connection.oauthToken.accessToken}`; 
              return headers;
            }            
        }
    },
    actions : {
    },
    triggers: {
        new_contact: {
          description: "Contact Created",
          hint: "Triggers when contact is created via constant contact",
          type:"poll",

          input_fields: () =>[],
          execute: async (connection, input, nextPoll) => {
            // console.log(nextPoll)  
            try {
              if(!nextPoll){
                nextPoll =  new Date().toISOString();
              }
              const url = "https://api.cc.email/v3/contacts?limit=1";
              const queryParams = {
                created_after : nextPoll
              }
              const headers = app.connection.authorization.credentials(connection);
              const response = await HttpUtils.request(url, headers, queryParams);
              events = response.body.contacts
              if(events.count > 0){
                nextPoll = events[0].created_after;
              }
  
              if (response.success === true)  {
                return HttpUtils.successResponse({
                  events: events,
                  nextPoll : nextPoll,
                });
                } else {
                 return HttpUtils.errorResponse(response.body, response.statusCode);
                } 
            } catch (error) {
              console.log(error);
              return HttpUtils.errorResponse(error.message);
            }
          },

          dedup : (contacts) =>{
            return contacts.contact_id;
          },
          
          output_fields: () => [
            {
              "key": "success",
              "name": "Success",
              "hintText": "Success",
              "helpText": "Success",
              "isExtendedSchema": false,
              "required": false,
              "type": "boolean",
              "controlType": "select",
              "pickList": [
                [
                  "Yes",
                  true
                ],
                [
                  "No",
                  false
                ]
              ]
            },
            {
              "key": "statusCode",
              "name": "Status Code",
              "hintText": "Status Code",
              "helpText": "Status Code",
              "isExtendedSchema": false,
              "required": false,
              "type": "number",
              "controlType": "text"
            },
            {
              "key": "response",
              "name": "Response",
              "hintText": "Response",
              "helpText": "Response",
              "isExtendedSchema": false,
              "required": false,
              "type": "object",
              "controlType": "object",
              "properties": [
                {
                  "key": "events",
                  "name": "Events",
                  "hintText": "Events",
                  "helpText": "Events",
                  "isExtendedSchema": false,
                  "required": false,
                  "type": "array",
                  "controlType": "array",
                  "as": "object",
                  "properties": [
                    {
                      "key": "contact_id",
                      "name": "Contact Id",
                      "hintText": "Contact Id",
                      "helpText": "Contact Id",
                      "isExtendedSchema": false,
                      "required": false,
                      "type": "string",
                      "controlType": "text"
                    },
                    {
                      "key": "email_address",
                      "name": "Email Address",
                      "hintText": "Email Address",
                      "helpText": "Email Address",
                      "isExtendedSchema": false,
                      "required": false,
                      "type": "object",
                      "controlType": "object",
                      "properties": [
                        {
                          "key": "address",
                          "name": "Address",
                          "hintText": "Address",
                          "helpText": "Address",
                          "isExtendedSchema": false,
                          "required": false,
                          "type": "string",
                          "controlType": "text"
                        },
                        {
                          "key": "permission_to_send",
                          "name": "Permission To Send",
                          "hintText": "Permission To Send",
                          "helpText": "Permission To Send",
                          "isExtendedSchema": false,
                          "required": false,
                          "type": "string",
                          "controlType": "text"
                        },
                        {
                          "key": "created_at",
                          "name": "Created At",
                          "hintText": "Created At",
                          "helpText": "Created At",
                          "isExtendedSchema": false,
                          "required": false,
                          "type": "string",
                          "controlType": "text"
                        },
                        {
                          "key": "updated_at",
                          "name": "Updated At",
                          "hintText": "Updated At",
                          "helpText": "Updated At",
                          "isExtendedSchema": false,
                          "required": false,
                          "type": "string",
                          "controlType": "text"
                        },
                        {
                          "key": "opt_in_source",
                          "name": "Opt In Source",
                          "hintText": "Opt In Source",
                          "helpText": "Opt In Source",
                          "isExtendedSchema": false,
                          "required": false,
                          "type": "string",
                          "controlType": "text"
                        },
                        {
                          "key": "opt_in_date",
                          "name": "Opt In Date",
                          "hintText": "Opt In Date",
                          "helpText": "Opt In Date",
                          "isExtendedSchema": false,
                          "required": false,
                          "type": "string",
                          "controlType": "text"
                        },
                        {
                          "key": "confirm_status",
                          "name": "Confirm Status",
                          "hintText": "Confirm Status",
                          "helpText": "Confirm Status",
                          "isExtendedSchema": false,
                          "required": false,
                          "type": "string",
                          "controlType": "text"
                        }
                      ]
                    },
                    {
                      "key": "first_name",
                      "name": "First Name",
                      "hintText": "First Name",
                      "helpText": "First Name",
                      "isExtendedSchema": false,
                      "required": false,
                      "type": "string",
                      "controlType": "text"
                    },
                    {
                      "key": "last_name",
                      "name": "Last Name",
                      "hintText": "Last Name",
                      "helpText": "Last Name",
                      "isExtendedSchema": false,
                      "required": false,
                      "type": "string",
                      "controlType": "text"
                    },
                    {
                      "key": "create_source",
                      "name": "Create Source",
                      "hintText": "Create Source",
                      "helpText": "Create Source",
                      "isExtendedSchema": false,
                      "required": false,
                      "type": "string",
                      "controlType": "text"
                    },
                    {
                      "key": "created_at",
                      "name": "Created At",
                      "hintText": "Created At",
                      "helpText": "Created At",
                      "isExtendedSchema": false,
                      "required": false,
                      "type": "string",
                      "controlType": "text"
                    },
                    {
                      "key": "updated_at",
                      "name": "Updated At",
                      "hintText": "Updated At",
                      "helpText": "Updated At",
                      "isExtendedSchema": false,
                      "required": false,
                      "type": "string",
                      "controlType": "text"
                    }
                  ]
                },
                {
                  "key": "nextPoll",
                  "name": "Next Poll",
                  "hintText": "Next Poll",
                  "helpText": "Next Poll",
                  "isExtendedSchema": false,
                  "required": false,
                  "type": "string",
                  "controlType": "text"
                }
              ]
            }
          ]
        },
    },
    test : async connection => {
      try {
        let url = "https://api.cc.email/v3/contacts";
    
        const headers = app.connection.authorization.credentials(connection)
        // console.log(headers)
        let response = await HttpUtils.request(
          url,
          headers,
          null,
          HttpUtils.HTTPMethods.GET,
        );
        if (response.success == true) {
          // console.log(response.body)
          return HttpUtils.successResponse({
              success: true
            });
          } else {
          return HttpUtils.errorResponse(response.body, response.statusCode);
        }
      } catch (error) {
        return HttpUtils.errorResponse(error.message);
      }
    },
};

module.exports = app;
