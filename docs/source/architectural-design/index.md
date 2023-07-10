# Architectural Design

## Introduction
The Application Package Editor has 2 main building blocks which are the frontend and backend as shown in 
the *Components Overview* figure. The frontend manages the users interactions with the editor while 
the backend is responsible for managing the Application Packages of the user in their Workspace. The frontend 
communicates with the backend though the API that is exposed by the backend. This API allows management 
(list, create, update and delete) of the Application Package Versions that are present in the user's Workspace.

![Components Overview](../assets/architectural_design/components_overview.png)
*<p style="text-align: center;">Components Overview</p>* 

## frontend
As mentioned above, the frontend is responsible for managing the user interaction with the editor. Thus, it 
provides a Graphical User Interface which:

  - Is implemented in a form based way using VueJS and bootstrap.
  - Allows uploading / downloading of Application Packages to and from the user's local system.
  - Allows the management of the user Application Packages that are present in the user Workspace. In order to achieve 
    this, it communicates with the backend in order to open/lock/save/delete Application Packages and their versions.

## backend
The Band-end is, on the other hand, responsible for the management the user workspace. It is implemented using the 
FastAPI library and expose an API to manage the Application Packages of the user Workspace. It exposes the following API endpoints which are used by the frontend to interact with the user workspace:
    
![API Endpoints](../assets/architectural_design/api_endpoints.png)
*<p style="text-align: center;">API Endpoints</p>* 

## Future enhancements
Some features that will be added in the future:
- The integration of the Editor as an app for the EOEPCA Applicatio Hub
- Integration with the user's EOEPCA workspace by mounting their S3 bucket.
