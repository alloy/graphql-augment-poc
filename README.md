Example of augmenting remote execution with:

- type extension using local fields -- e.g. for local state
- mutating of remote field result -- e.g. for localizing field results

```bash
$ yarn install
$ yarn start
```

```json
{
  "data": {
    "user": {
      "name": "Satya",
      "title": "Bossmang",
      "hasLocalState": true
    }
  }
}
```
