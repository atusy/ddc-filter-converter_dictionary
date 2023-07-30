Adds info to completion candidates based if a definition exists in one of the specified dictionaries.

Dictionaries are JSON files following `Record<string, unknown>`.

Definition is `JSON.stringify`-ed.

```vim
ddc#custom#patch_global('filterParams', #{
\   converter_dictionary: #{
\     dicts: ['/path/to/Record<string, unknown>.json']
\   }
\ })
```
