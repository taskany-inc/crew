# Changelog

All notable changes to this project will be documented in this file. See [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit guidelines.

## [0.19.0](https://github.com/taskany-inc/crew/compare/v0.18.0...v0.19.0) (2023-11-16)


### Features

* **TeamPage:** group interface on group page ([3ad2578](https://github.com/taskany-inc/crew/commit/3ad2578c6fbf536cb032be64d231508b8c983798))

## [0.18.0](https://github.com/taskany-inc/crew/compare/v0.17.0...v0.18.0) (2023-11-10)


### Features

* bonus points store link ([64349ed](https://github.com/taskany-inc/crew/commit/64349ed62c78e06c811ea9fda38a929d62bb3c73))


### Bug Fixes

* **bonus history:** new records first ([7622e17](https://github.com/taskany-inc/crew/commit/7622e178ffdd0bcd4cfb162ebaccd5668f69ec4a))
* hide bonus points from user page ([6f65452](https://github.com/taskany-inc/crew/commit/6f654526339ee374845f7589489fde2f10e14c25))

## [0.17.0](https://github.com/taskany-inc/crew/compare/v0.16.1...v0.17.0) (2023-11-09)


### Features

* **TeamPage:** tree view for groups ([3eaae74](https://github.com/taskany-inc/crew/commit/3eaae74f851674db651460f94d303917df1ed2a5))
* **UsersPage:** filters on UserPage ([c55399c](https://github.com/taskany-inc/crew/commit/c55399c3a1b5d848690963dfbd5b9f7b89acdbb8))


### Bug Fixes

* allow archiving groups with archived children ([abce2e6](https://github.com/taskany-inc/crew/commit/abce2e6b1471c3072fbafe1227af5aa76f521d45))
* disallow unarchiving when parent is archived ([4de1df6](https://github.com/taskany-inc/crew/commit/4de1df6b0d056686ba0311b17907eff86de7f70b))
* **UserUpdateForm:** fix supervisor field behaviour ([bda2775](https://github.com/taskany-inc/crew/commit/bda27757bb2d4a2dc78cfea573c6c8bffb4fcc74))

## [0.16.1](https://github.com/taskany-inc/crew/compare/v0.16.0...v0.16.1) (2023-11-07)


### Bug Fixes

* **rest router:** catch nested routes ([75d0b9c](https://github.com/taskany-inc/crew/commit/75d0b9c79cbb0c2c0b3ee47a7d3c6c2727271251))

## [0.16.0](https://github.com/taskany-inc/crew/compare/v0.15.0...v0.16.0) (2023-11-02)


### Features

* archived groups and memberships ([490bcd5](https://github.com/taskany-inc/crew/commit/490bcd511c645ebd0850ffe92b67176b8ce7beeb))
* default locale from env ([c85b848](https://github.com/taskany-inc/crew/commit/c85b848fe158ba4964f4d45869a4c95a7ffa28f0))
* **rest api:** change bonus points endpoint ([b8f634f](https://github.com/taskany-inc/crew/commit/b8f634f061d8db855cadf113264ab0b0afc98d69))
* rest endpoints with token auth ([b2ee694](https://github.com/taskany-inc/crew/commit/b2ee694b38764d1bb54241c1f4922d125a4ee700))
* user profile by email ([3b253df](https://github.com/taskany-inc/crew/commit/3b253df152ac86f17c69f55b8479f2c3697a8b57))
* user update form ([5416708](https://github.com/taskany-inc/crew/commit/541670839deb972e98b088f61b3dad99bfe1a6cf))
* **UserPage:** device form ([bc0bf34](https://github.com/taskany-inc/crew/commit/bc0bf34ae451839cc2cf4ab181b8a0b7d11681e2))
* **UserSettingsPage:** theme selector ([8d0eda0](https://github.com/taskany-inc/crew/commit/8d0eda0f8bdef16045391d19b0e78af8682e2cf8))

## [0.15.0](https://github.com/taskany-inc/crew/compare/v0.14.1...v0.15.0) (2023-10-23)


### Features

* group page and group settings page ([8029ed3](https://github.com/taskany-inc/crew/commit/8029ed3168315296e239f0851102858f6f240d92))
* **UserPage:** group and roles management ([0ba6563](https://github.com/taskany-inc/crew/commit/0ba65631da7a91bc377d1ba77439bbbf5f40aee6))


### Bug Fixes

* align inline icons ([ca35f50](https://github.com/taskany-inc/crew/commit/ca35f507690c3137823ea6dff1a05df00992d986))
* **Link:** remove link props from dom ([c2fa509](https://github.com/taskany-inc/crew/commit/c2fa50912736fa88d71563f52a5146e714948fc7))
* **user services:** correct links and service name popup ([fa7aa05](https://github.com/taskany-inc/crew/commit/fa7aa055b0cccfa1a01f0632d9478a655d032684))

## [0.14.1](https://github.com/taskany-inc/crew/compare/v0.14.0...v0.14.1) (2023-10-16)


### Bug Fixes

* remove services/projects/goals tab in group page ([01b80de](https://github.com/taskany-inc/crew/commit/01b80dec4ebb620d9b55efe1cab529e68504dd4c))
* **user query:** sort memberships by group name ([b1655a5](https://github.com/taskany-inc/crew/commit/b1655a590b4186460857db4f680cf68414afcfe9))
* **UserPage:** consistent service list ([9cd3c4f](https://github.com/taskany-inc/crew/commit/9cd3c4f05a0db110a7d531c6ef12cf2d1c53d36f))
* **UserPage:** constant padding between sections ([95b5067](https://github.com/taskany-inc/crew/commit/95b5067bf22c56e960a64b1beac4d7dd634fbe65))

## [0.14.0](https://github.com/taskany-inc/crew/compare/v0.13.0...v0.14.0) (2023-10-13)


### Features

* supervisors for groups and users ([c28cec6](https://github.com/taskany-inc/crew/commit/c28cec6e40e4191bf5674e868a7607286447c0e6))
* user summary moved to a component ([44b7c2c](https://github.com/taskany-inc/crew/commit/44b7c2cdc7fb0fc464887996fcf4c59178438317))
* **UserPreview:** editable group list ([4c5867d](https://github.com/taskany-inc/crew/commit/4c5867de16907005cd141ab26ac3b99e90f5c09d))


### Bug Fixes

* **Previews:** preview headers are inconsistent ([8ee5691](https://github.com/taskany-inc/crew/commit/8ee56914e17d2f90833b3ee16e932252bf105b27))
* **UserPage:** add and display user services ([e0dc8fa](https://github.com/taskany-inc/crew/commit/e0dc8fa92a1073ff4da1fe7633329446fcf100eb))
* **UserPage:** show all groups in a list ([2c6a3b1](https://github.com/taskany-inc/crew/commit/2c6a3b1dfaf760a3f02344a325fb1c75d6cea869))
* wider list items ([8d5c850](https://github.com/taskany-inc/crew/commit/8d5c8506230f1bbe84ac8d11ccdfc64d72337bf6))

## [0.13.0](https://github.com/taskany-inc/crew/compare/v0.12.0...v0.13.0) (2023-10-11)


### Features

* **TeamPreview:** add team inline form ([9d4399d](https://github.com/taskany-inc/crew/commit/9d4399d797d39565eedb68a91b15801e3d43a398))
* **UserPage:** add and display user services ([c2cec1a](https://github.com/taskany-inc/crew/commit/c2cec1a5fbd687b323020b3dd12feb2a1b3cf780))


### Bug Fixes

* **oauth:** allow email account linking ([316d8c0](https://github.com/taskany-inc/crew/commit/316d8c0cdc28b2d4b5b7dcb6decbcc6d7ff93871))

## [0.12.0](https://github.com/taskany-inc/crew/compare/v0.11.0...v0.12.0) (2023-10-09)


### Features

* **access control:** add global admins, restrict user editing ([21292db](https://github.com/taskany-inc/crew/commit/21292dbae7152739df49442a911cca9b8df7e170))
* bonus points history and form ([89055b5](https://github.com/taskany-inc/crew/commit/89055b5680a3fa029317da21ef3eee371fd79b6c))
* bonus points history popup ([0fcd0bb](https://github.com/taskany-inc/crew/commit/0fcd0bb60b0e3ec3549f2ad4e78ef75cd4a0036a))
* **bonus points:** show in user page ([5b0ec50](https://github.com/taskany-inc/crew/commit/5b0ec50064299c90ee3194a4b964e6f9a7cd34d6))
* redirect to my profile from root ([ee83b92](https://github.com/taskany-inc/crew/commit/ee83b92af91181fc97ed4dec06782ef66aadc8a7))


### Bug Fixes

* profile links should open pop-ups ([221076e](https://github.com/taskany-inc/crew/commit/221076e82b45caf6aaae38fcfce515752b364a35))

## [0.11.0](https://github.com/taskany-inc/crew/compare/v0.10.0...v0.11.0) (2023-09-27)


### Features

* **group preview:** transfer group ([6696a2a](https://github.com/taskany-inc/crew/commit/6696a2aa23ad844e52283081a2c2d8a5ff9da58f))
* profile links should open pop-ups ([805c7fe](https://github.com/taskany-inc/crew/commit/805c7feefb954c862af5bbdc8fb46982d394a4b1))
* **TeamPreview:** add and remove users ([83f9156](https://github.com/taskany-inc/crew/commit/83f91563623fccd255161577b3e5e1bbce9ead45))

## [0.10.0](https://github.com/taskany-inc/crew/compare/v0.9.0...v0.10.0) (2023-09-25)


### Features

* **GlobalSearch:** search in header ([1d88e14](https://github.com/taskany-inc/crew/commit/1d88e14e3cd7a9ee039a586d6fe69cce51d9d3d6))
* **group preview:** role mgmt, layout ([8988250](https://github.com/taskany-inc/crew/commit/898825002eaf9281c8b55a2e78b3009ce9e961c1))
* inline form in contacts ([8d7ae31](https://github.com/taskany-inc/crew/commit/8d7ae31c4b980c90f15cf8ba05f9fe72a85028d4))
* method for global search ([63d4ca4](https://github.com/taskany-inc/crew/commit/63d4ca4a37310194446724f46a76772a4346ccb6))
* remove timeline divider from profile ([76bf707](https://github.com/taskany-inc/crew/commit/76bf7078a01db84adae856cf7fbb0e0af0be1437))
* **UserPreview:** implement missing features ([8038e20](https://github.com/taskany-inc/crew/commit/8038e20e6d9d5bbe15b5afd18b563f56d0849500))

## [0.9.0](https://github.com/taskany-inc/crew/compare/v0.8.0...v0.9.0) (2023-09-11)


### Features

* corporate devices in the user profile ([76f8f90](https://github.com/taskany-inc/crew/commit/76f8f900dd58711996d7120c61706229c2abd936))
* **db:** group, membership, role schemas ([b8db16c](https://github.com/taskany-inc/crew/commit/b8db16cd8373121e01e26223b520e0b01a343c39))
* **groups:** basic methods ([282b4cb](https://github.com/taskany-inc/crew/commit/282b4cbed24d52ed5957a7b821473430e61680cf))


### Bug Fixes

* **avatars:** correctly use bricks component ([967dad9](https://github.com/taskany-inc/crew/commit/967dad97b7d91a7cc10dd6a2110c3b24255921bf))
* **links:** preserve locale ([44763f1](https://github.com/taskany-inc/crew/commit/44763f168ab0f48518cd4fb3a769bb00487f28ae))

## [0.8.0](https://github.com/taskany-inc/crew/compare/v0.7.0...v0.8.0) (2023-08-31)


### Features

* external services model ([d7dc190](https://github.com/taskany-inc/crew/commit/d7dc190503bbb401c52c97a2c17bd1109a65f415))
* feedback button as in issues ([440f367](https://github.com/taskany-inc/crew/commit/440f36705b3822fed922f6447cc12296b2edf5cf))


### Bug Fixes

* **api:** use protected routes ([bf426a3](https://github.com/taskany-inc/crew/commit/bf426a3ea99d2e5891c78e5fc15cd1d8b994359f))
* **db schema:** change timestamp db values to match db values ([53a071d](https://github.com/taskany-inc/crew/commit/53a071d83ec5f4d4ef16f8dca368a4a8f20c4ef7))

## [0.7.0](https://github.com/taskany-inc/crew/compare/v0.6.0...v0.7.0) (2023-08-28)


### Features

* **auth:** api auth handlers ([0410b38](https://github.com/taskany-inc/crew/commit/0410b38f28c123e140104454d1cd7bca3c7575e5))
* icons from the package taskany/icons ([99549f8](https://github.com/taskany-inc/crew/commit/99549f87491a4a3c92b46c1bededad8985c55c16))

## [0.6.0](https://github.com/taskany-inc/crew/compare/v0.5.0...v0.6.0) (2023-08-24)


### Features

* group preview popup ([66c6990](https://github.com/taskany-inc/crew/commit/66c6990e68d3df4e391fb093615e28bda69fa13f))
* user preview in popup ([2054ae7](https://github.com/taskany-inc/crew/commit/2054ae715ff9f1a677a2dc1627674954790a6ae6))
* user preview in popup ([615fc67](https://github.com/taskany-inc/crew/commit/615fc677c1ab22bfe49ede63c0713fdca885c3a4))


### Bug Fixes

* contacts paddings are non-consistent ([11ed8d3](https://github.com/taskany-inc/crew/commit/11ed8d3f5eb197746309d7d0ff488580209f52ae))
* group preview popup ([8549d21](https://github.com/taskany-inc/crew/commit/8549d217820428bd0fcb6e06ea5954be09f2b64d))

## [0.5.0](https://github.com/taskany-inc/crew/compare/v0.4.1...v0.5.0) (2023-08-16)


### Features

* group links ([0308051](https://github.com/taskany-inc/crew/commit/0308051eef3f934d893f321dcb3701bf311b5c4f))
* group page ([f94ca79](https://github.com/taskany-inc/crew/commit/f94ca7925ba7752ab9bfe29528ec1802d79d67e3))


### Bug Fixes

* **db schema:** use utc timestamps ([489bc9f](https://github.com/taskany-inc/crew/commit/489bc9f6f91e89a42db8b0e2fa5df113a931c0fb))
* group links ([eadb620](https://github.com/taskany-inc/crew/commit/eadb620f28bd51602ecdb9e58455e2d401d305f8))

## [0.4.1](https://github.com/taskany-inc/crew/compare/v0.4.0...v0.4.1) (2023-08-03)


### Bug Fixes

* layout needs some space under header ([3080f72](https://github.com/taskany-inc/crew/commit/3080f72e3128e7a47b3bf762d50c99d7737f846d))
* text offsets are wrong ([de5c7c1](https://github.com/taskany-inc/crew/commit/de5c7c1203a9b9e521924895347fd072cf4d3374))

## [0.4.0](https://github.com/taskany-inc/crew/compare/v0.3.0...v0.4.0) (2023-07-31)


### Features

* **auth:** login with password or keycloak ([f2b6019](https://github.com/taskany-inc/crew/commit/f2b6019d23d4db31ce273503f10b5a467b29acc9))

## [0.3.0](https://github.com/taskany-inc/crew/compare/v0.2.7...v0.3.0) (2023-07-27)


### Features

* Link to the manager's page ([4fa8c7a](https://github.com/taskany-inc/crew/commit/4fa8c7ad2277c5df3a65830aab05a6c9c39adff2))

## [0.2.7](https://github.com/taskany-inc/crew/compare/v0.2.6...v0.2.7) (2023-07-24)


### Bug Fixes

* rewrite user fetch to next api route ([ebf7ae9](https://github.com/taskany-inc/crew/commit/ebf7ae93ff475be046b3fb06d2962e2a044f7b1b))

## [0.2.6](https://github.com/taskany-inc/crew/compare/v0.2.5...v0.2.6) (2023-07-24)


### Bug Fixes

* format secrets in build workflow ([ff9a013](https://github.com/taskany-inc/crew/commit/ff9a0137edf21c11f1109dfc3b8fa32044299c46))

## [0.2.5](https://github.com/taskany-inc/crew/compare/v0.2.4...v0.2.5) (2023-07-24)


### Bug Fixes

* Add user data ([4090bce](https://github.com/taskany-inc/crew/commit/4090bcefa2a3fa51ce1bb364109789f0aca5086a))
* pass env secrets to build ([a18be66](https://github.com/taskany-inc/crew/commit/a18be6657473cf8d1ac2dfce4a6f3094a04970e7))

## [0.2.4](https://github.com/taskany-inc/crew/compare/v0.2.3...v0.2.4) (2023-07-21)


### Bug Fixes

* inherit secrets in workflow ([f9707ea](https://github.com/taskany-inc/crew/commit/f9707eaadf38b1b3dd2dcf145e20d0164c7e85b7))

## [0.2.3](https://github.com/taskany-inc/crew/compare/v0.2.2...v0.2.3) (2023-07-21)


### Bug Fixes

* add backend url env in docker ([d7d7a67](https://github.com/taskany-inc/crew/commit/d7d7a670c732c30f3d6275e8d74e4700d97da1ba))

## [0.2.2](https://github.com/taskany-inc/crew/compare/v0.2.1...v0.2.2) (2023-07-21)


### Bug Fixes

* remove header provider from next config ([82a6954](https://github.com/taskany-inc/crew/commit/82a69543c3017ad238d4e3c6ba16dabcb1d430fc))

## [0.2.1](https://github.com/taskany-inc/crew/compare/v0.2.0...v0.2.1) (2023-07-21)


### Bug Fixes

* consistent formatting ([8a8e1d0](https://github.com/taskany-inc/crew/commit/8a8e1d0661504613e49d2b1d07d26fb61817bc35))

## 0.2.0 (2023-07-21)


### Features

* add Footer ([a572c94](https://github.com/taskany-inc/crew/commit/a572c94a601b7bda8b56f1e449b20eb911388944))
* add user data ([#27](https://github.com/taskany-inc/crew/issues/27)) ([9a555c3](https://github.com/taskany-inc/crew/commit/9a555c37b0217fc42b3a8b15b858972abe87a3f5))
* add User page ([e65ddf6](https://github.com/taskany-inc/crew/commit/e65ddf6d82c33cd7f917863d13fe06becdabcff8))
* backend proxy mode ([b059417](https://github.com/taskany-inc/crew/commit/b05941710905a571f9f00b94074f8585c694843f))
* basic repo setup ([2eddd4c](https://github.com/taskany-inc/crew/commit/2eddd4caacae81de8308b0486cbdf7a2070c4a14))
* Support i18n ([89c4274](https://github.com/taskany-inc/crew/commit/89c4274aa33448958f48928cd8e345a7475cb1ce))
* Support i18n ru ([#23](https://github.com/taskany-inc/crew/issues/23)) ([357caf1](https://github.com/taskany-inc/crew/commit/357caf1a4f137257f4ff597811addc62845d70b8))


### Bug Fixes

* add User Page ([#16](https://github.com/taskany-inc/crew/issues/16)) ([af308d6](https://github.com/taskany-inc/crew/commit/af308d6e694183e9ff7532d64e69dd8d58faf96c))
* Fix footer ([#25](https://github.com/taskany-inc/crew/issues/25)) ([63ba625](https://github.com/taskany-inc/crew/commit/63ba625a2e5f792cb0f33ded51140627924a88a8))
