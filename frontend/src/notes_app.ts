/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/notes_app.json`.
 */
export type NotesApp = {
  "address": "FchaqsnrXy4NyEZ1ddpkz1MNVnMo1pStEro3Jak9zvLk",
  "metadata": {
    "name": "notesApp",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "createNote",
      "discriminator": [
        103,
        2,
        208,
        242,
        86,
        156,
        151,
        107
      ],
      "accounts": [
        {
          "name": "note",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "arg",
                "path": "noteId"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "content",
          "type": "string"
        },
        {
          "name": "noteId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "deleteNote",
      "discriminator": [
        182,
        211,
        115,
        229,
        163,
        88,
        108,
        217
      ],
      "accounts": [
        {
          "name": "note",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "note.note_id",
                "account": "note"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "relations": [
            "note"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "updateNote",
      "discriminator": [
        103,
        129,
        251,
        34,
        33,
        154,
        210,
        148
      ],
      "accounts": [
        {
          "name": "note",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "note.note_id",
                "account": "note"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "relations": [
            "note"
          ]
        }
      ],
      "args": [
        {
          "name": "content",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "note",
      "discriminator": [
        203,
        75,
        252,
        196,
        81,
        210,
        122,
        126
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "You are not authorized to perform this action."
    },
    {
      "code": 6001,
      "name": "contentTooLong",
      "msg": "Content is too long. Maximum 1000 characters."
    },
    {
      "code": 6002,
      "name": "contentEmpty",
      "msg": "Content cannot be empty."
    }
  ],
  "types": [
    {
      "name": "note",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "noteId",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
