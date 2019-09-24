---
code: true
type: page
title: mUpdate
---

# mUpdate



Updates multiple documents.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/<index>/<collection>/_mUpdate[?refresh=wait_for][&retryOnConflict=<retries>]
Method: PUT
Body:
```

```js
{
  "documents": [
    {
      "_id": "<documentId>",
      "body": {
        // document changes
      }
    },
    {
      "_id": "<anotherDocumentId>",
      "body": {
        // document changes
      }
    }
  ]
}
```

### Other protocols

```js
{
  "index": "<index>",
  "collection": "<collection>",
  "controller": "document",
  "action": "mUpdate",
  "body": {
    "documents": [
      {
        "_id": "<documentId>",
        "body": {
          // document changes
        }
      },
      {
        "_id": "<anotherDocumentId>",
        "body": {
          // document changes
        }
      }
    ]
  }
}
```

---

## Arguments

- `collection`: collection name
- `index`: index name

### Optional:

- `refresh`: if set to `wait_for`, Kuzzle will not respond until the updates are indexed
- `retryOnConflict`: conflicts may occur if the same document gets updated multiple times within a short timespan in a database cluster. You can set the `retryOnConflict` optional argument (with a retry count), to tell Kuzzle to retry the failing updates the specified amount of times before rejecting the request with an error.

---

## Body properties

- `documents`: an array of object. Each object describes a document to update, by exposing the following properties:
  - `_id` : ID of the document to replace
  - `body`: partial changes to apply to the document

---

## Response

Returns an object containing 2 arrays: `successes` and `errors`

Each updated document is an object of the `successes` array with the following properties:

- `_id`: document unique identifier
- `_source`: document content
- `_version`: version of the document (should be `1`)

Each errored document is an object of the `errors` array with the following properties:

- `document`: original document that caused the error
- `status`: HTTP error status code
- `reason`: human readable reason

```js
{
  "status": 200,
  "error": null,
  "index": "<index>",
  "collection": "<collection>",
  "action": "mUpdate",
  "controller": "document",
  "requestId": "<unique request identifier>",
  "result": {
    "successes": [
      {
        "_id": "<documentId>",
        "_version": 2,
        "_source": {
          // updated document content
        }
      },
      {
        "_id": "<anotherDocumentId>",
        "_version": 4,
        "_source": {
          // updated document content
        }
      }
    ],
    "errors": 2
  }
}
```