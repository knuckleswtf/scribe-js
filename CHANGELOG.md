# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project aims to adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## <Version> (<Release date>)
### Fixes

### Changes

### Additions

### Removals


## 1.8.1 (Monday, 21 June 2021)
### Modified
- [Adonis] Start server correctly for response calls

## 1.8.0 (Monday, 21 June 2021)
### Modified
- [Express] Improve route matching

## 1.7.0 (Saturday, 19 June 2021)
### Modified
- [Restify] Improve route matching
### Fixed
- [Express] Fix duplicate routes

## Modified
## 1.6.0 (Thursday, 17 June 2021)
UX/setup improvements
## Modified
- [Express] Automatically infer server file
- [Express, Restify] Remove the need to manually require the package in app file

## 1.5.0 (Thursday, 17 June 2021)
## Added
- Improve Restify routing support
  
## 1.4.0 (Wednesday, 16 June 2021)
## Added
- Support Express chainable routes

## 1.1.1 (Saturday, 14 November 2020)
### Fixes
- Fixed errors with handling arrays of files (https://github.com/knuckleswtf/scribe-js/commit/dede0821f67ab08e8d4f75d31264b138f90dfee1)
- Fixed errors with handling nested objects in arrays of objects (https://github.com/knuckleswtf/scribe-js/commit/26c1ef620f7b0155b0eca283c581fc9651860327)

## 1.1.0 (Thursday, 12 November 2020)
### Changes
- tryitout.js will now include the current Scribe version number in its filename, for automatic cache busting (https://github.com/knuckleswtf/scribe-js/commit/37d68b6b235068125e714915a425056aaebd2d95)

### Fixes
- Fixed bug where query param values that were objects were set as [object Object] in Try It Out url (https://github.com/knuckleswtf/scribe-js/commit/67f609c8669b5deff41703009d396c1033263259)
- Renamed internal property 'fields' to '__fields' to prevent possible clashes with a user-supplied field called 'fields'. (https://github.com/knuckleswtf/scribe-js/commit/a3d30277b62f9775f3d305e0c03f31bdc133b2c7)
- Don't print undefined when printing empty arrays for query params (https://github.com/knuckleswtf/scribe-js/commit/52c588989cc024ff4e8d2e07f7ed66ec062d077c)

## 1.0.1 (Monday, 26 October 2020)
### Fixes
- Added a missing colon in Try It Out buttons' CSS (https://github.com/knuckleswtf/scribe/pull/123)

## 1.0.0 (Saturday, 24 October 2020)