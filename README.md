# GitHub Repository Fetcher API Documentation

## Overview

The GitHub Repository Fetcher API allows you to fetch and unzip files from a specified GitHub repository. It provides a simple interface to retrieve the contents of a repository branch, with options to include or exclude specific file extensions and directories.

## API Version

- **Action Schema Version:** 0.0.1
- **OpenAPI Version:** 3.0.0

## Base URL

- **Default Server:** `https://github-contents-worker.actionschema.workers.dev`

## Endpoints

### Fetch and Unzip Files from a GitHub Repository

#### Endpoint

- **URL:** `/{owner}/{repo}/{branch}`
- **Method:** GET

#### Description

Fetches the specified branch of the given repository owned by the specified owner, unzips the files, and returns their contents.

#### Parameters

| Name        | In     | Type   | Required | Description                                             |
| ----------- | ------ | ------ | -------- | ------------------------------------------------------- |
| owner       | path   | string | Yes      | GitHub repository owner                                 |
| repo        | path   | string | Yes      | GitHub repository name                                  |
| branch      | path   | string | Yes      | GitHub repository branch                                |
| include-ext | query  | string | No       | Comma-separated list of file extensions to include      |
| exclude-ext | query  | string | No       | Comma-separated list of file extensions to exclude      |
| exclude-dir | query  | string | No       | Comma-separated list of directories to exclude          |
| accept      | header | string | No       | Accept header, use "application/json" for JSON response |

#### Responses

| Status Code | Description                 | Content Type                 | Schema                                                                            |
| ----------- | --------------------------- | ---------------------------- | --------------------------------------------------------------------------------- |
| 200         | Successful response         | application/json, text/plain | Keys are file paths prefixed with {repo}/{branch}/. Values are the file contents. |
| 302         | Redirect to the main branch | -                            | -                                                                                 |
| 400         | Bad Request                 | text/plain                   | -                                                                                 |
| 404         | Not Found                   | text/plain                   | -                                                                                 |
| 500         | Internal Server Error       | text/plain                   | -                                                                                 |

## Example Request

### Fetching Repository Files

#### Request

```
GET /octocat/Hello-World/master?include-ext=md,txt&exclude-dir=node_modules
Host: github-contents-worker.actionschema.workers.dev
Accept: application/json
```

#### Response

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "Hello-World/main/README.md": "This is the README file content...",
  "Hello-World/main/docs/intro.txt": "Introduction to the project..."
}
```

## Error Handling

### Common Error Responses

- **400 Bad Request:** The request could not be understood by the server due to malformed syntax.
- **404 Not Found:** The requested resource could not be found.
- **500 Internal Server Error:** The server encountered an unexpected condition which prevented it from fulfilling the request.

## Notes

- Ensure the `accept` header is set to "application/json" if you prefer the response in JSON format.
- The `include-ext` and `exclude-ext` query parameters help in filtering the files by their extensions.
- The `exclude-dir` query parameter helps in excluding specific directories from the response.
