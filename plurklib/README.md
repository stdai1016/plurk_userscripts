# Plurklib

An unofficial library for [Plurk](https://www.plurk.com).

## API

### Functions

* `plurklib.getUserData(): object`
* `plurklib.getPageUserData(): object`
* `plurklib.callApi(path: string, options:? object): Promise<any>`
* `plurklib.getNotificationsMixed2(limit?: number, offset?: string | number | Date): Promise<object>`
* `plurklib.fetchUserAliases(): Promise<object>`
* `plurklib.fetchUserInfo(userIdOrNickName: number | string): Promise<object>`
* `plurklib.getResponses(plurkId: number, from?: number): Promise<object>`
* `plurklib.getCustomCss(userId?: number): Promise<string[]>`

### Classes

* `plurklib.PlurkRecord`
* `plurklib.PlurkObserver`
* `plurklib.Plurk`

## Updates

* 0.1.1 - Initial version

## License

Plurk Lib is licensed under [MIT](https://raw.githubusercontent.com/stdai1016/plurk_userscripts/greasyfork/LICENSE).
