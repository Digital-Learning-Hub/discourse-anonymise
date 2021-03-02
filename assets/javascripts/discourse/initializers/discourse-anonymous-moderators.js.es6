import { withPluginApi } from "discourse/lib/plugin-api";
import { ajax } from "discourse/lib/ajax";
import { iconNode } from "discourse-common/lib/icon-library";
import { userPath } from "discourse/lib/url";

function initializeAnonymousUser(api) {
  api.attachWidgetAction("user-menu", "switchToAnonUser", () => {
    ajax("/anonymous-moderators/become-anon", {method: "POST"}).then(() => {
      window.location.reload();
    });
  });

  api.attachWidgetAction("user-menu", "switchToMasterUser", () => {
    ajax("/anonymous-moderators/become-master", {method: "POST"}).then(() => {
      window.location.reload();
    });
  });

  api.addUserMenuGlyph((widget) => {
    const user = widget.currentUser;
    if (user.can_become_anonymous_moderator) {
      return {
        label: "anonymous_moderators.switch_to_anon",
        icon: "user-secret",
        action: "switchToAnonUser",
      };
    } else if (user.is_anonymous_moderator) {
      return {
        label: "anonymous_moderators.switch_to_master",
        icon: "ban",
        action: "switchToMasterUser",
      };
    } else {
      return false;
    }
  });

  api.decorateWidget(`poster-name:after`, dec => {
    const attrs = dec.attrs;
    var username = (attrs.userCustomFields || {}).parent_user_username;
    var allow = false;
    if (!username) {
      return null;
    }

    // if the user is UoM Staff, or if the anon account for the user is the same as anon.
    if ((api.getCurrentUser().trust_level === 4)) {
      allow = true;
    } else if (username == api.getCurrentUser().username) {
      // username of parent matches the current user's username.
      username = "your anon account"
      allow = true;
    }
    if (allow) {
      return dec.h(
        "span.poster-parent-username",
        dec.h(
          "a.anon-identity",
          {
            attributes: {
              "data-user-card": username,
              href: userPath()
              // TODO: something interesting with anon path?? maybe switch to anon?
            }
          },
          [iconNode("user-secret"), ` ${username}`]
        )
      );
    }
  });
  api.onToolbarCreate(toolbar => {
    const user = api.getCurrentUser();
    if (user.can_become_anonymous_moderator) {
      toolbar.addButton({
        id: "composer_anon_toggle",
        group: "extras",
        icon: "user-secret",
        // label: "anonymous_moderators.switch_to_anon",
        action: () => ajax("/anonymous-moderators/become-anon", { method: "POST" }).then(() => { window.location.reload(); }),
        position: "last"
      });
    } else if (user.is_anonymous_moderator) {
      toolbar.addButton({
        id: "composer_anon_toggle",
        group: "extras",
        icon: "user-secret",
        // label: "anonymous_moderators.switch_to_master",
        action: "switchToMasterUser",
        position: "last"
      });
    } else {
      return false;
    }
  });


}


  export default {
  name: "discourse-anonymous-moderators",

  initialize(container) {
    const siteSettings = container.lookup("site-settings:main");
    if (siteSettings.anonymous_moderators_enabled) {
      withPluginApi("0.8", initializeAnonymousUser);
    }
  },
};
