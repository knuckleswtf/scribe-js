# Documenting your API

```eval_rst
.. attention:: These docs are for Scribe for JS v1, which is no longer maintained. See `scribe.knuckles.wtf/nodejs <http://scribe.knuckles.wtf/nodejs>`_ for Scribe for JS v2.
```

Scribe tries to infer information about your API from your code, but you can enrich this information in the config and by using annotations (tags in doc block comments).


```eval_rst
.. Important:: For Express and Restify routes, the docblock needs to be on the route declaration, not the function declaration. For instance:

  .. code:: javascript 
     class UserController {
       /**
        * This docblock will work with Scribe for Adonis.js, but not Express.
        */
       createUser(req, res) {
       }   
     }
     
     /**
      * This docblock will work with Scribe for Express.
      */
     app.post('/users', UserController.create)

```

```eval_rst
.. toctree::
   :maxdepth: 2

   documenting-api-information
   documenting-endpoint-metadata
   documenting-endpoint-headers.md
   documenting-endpoint-query-parameters.md
   documenting-endpoint-body-parameters.md
   documenting-endpoint-responses.md
```

## Excluding endpoints from the documentation
You can exclude endpoints from the documentation by using the `@hideFromApiDocs` tag in the relevant doc block (on the route declaration). Scribe will not extract any information about the route or add it to the generated docs.
