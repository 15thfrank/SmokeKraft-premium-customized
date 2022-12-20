window.theme = window.theme || {};
window.slate = window.slate || {};

/**
 * Utility helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions for dealing with arrays and objects
 *
 * @namespace utils
 */

slate.utils = {

  /**
   * Return an object from an array of objects that matches the provided key and value
   *
   * @param {array} array - Array of objects
   * @param {string} key - Key to match the value against
   * @param {string} value - Value to get match of
   */
  findInstance: function(array, key, value) {
    for (var i = 0; i < array.length; i++) {
      if (array[i][key] === value) {
        return array[i];
      }
    }
  },

  /**
   * Remove an object from an array of objects by matching the provided key and value
   *
   * @param {array} array - Array of objects
   * @param {string} key - Key to match the value against
   * @param {string} value - Value to get match of
   */
  removeInstance: function(array, key, value) {
    var i = array.length;
    while(i--) {
      if (array[i][key] === value) {
        array.splice(i, 1);
        break;
      }
    }

    return array;
  },

  /**
   * _.compact from lodash
   * Remove empty/false items from array
   * Source: https://github.com/lodash/lodash/blob/master/compact.js
   *
   * @param {array} array
   */
  compact: function(array) {
    var index = -1;
    var length = array == null ? 0 : array.length;
    var resIndex = 0;
    var result = [];

    while (++index < length) {
      var value = array[index];
      if (value) {
        result[resIndex++] = value;
      }
    }
    return result;
  },

  /**
   * _.defaultTo from lodash
   * Checks `value` to determine whether a default value should be returned in
   * its place. The `defaultValue` is returned if `value` is `NaN`, `null`,
   * or `undefined`.
   * Source: https://github.com/lodash/lodash/blob/master/defaultTo.js
   *
   * @param {*} value - Value to check
   * @param {*} defaultValue - Default value
   * @returns {*} - Returns the resolved value
   */
  defaultTo: function(value, defaultValue) {
    return (value == null || value !== value) ? defaultValue : value
  }
};

slate.a11y = {

  /**
   * For use when focus shifts to a container rather than a link
   * eg for In-page links, after scroll, focus shifts to content area so that
   * next `tab` is where user expects if focusing a link, just $link.focus();
   *
   * @param {JQuery} $element - The element to be acted upon
   */
  pageLinkFocus: function($element) {
    var focusClass = 'js-focus-hidden';

    $element.first()
      .attr('tabIndex', '-1')
      .focus()
      .addClass(focusClass)
      .one('blur', callback);

    function callback() {
      $element.first()
        .removeClass(focusClass)
        .removeAttr('tabindex');
    }
  },

  /**
   * If there's a hash in the url, focus the appropriate element
   */
  focusHash: function() {
    var hash = window.location.hash;

    // is there a hash in the url? is it an element on the page?
    if (hash && document.getElementById(hash.slice(1))) {
      this.pageLinkFocus($(hash));
    }
  },

  /**
   * When an in-page (url w/hash) link is clicked, focus the appropriate element
   */
  bindInPageLinks: function() {
    $('a[href*=#]').on('click', function(evt) {
      this.pageLinkFocus($(evt.currentTarget.hash));
    }.bind(this));
  },

  /**
   * Traps the focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {jQuery} options.$elementToFocus - Element to be focused when focus leaves container
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  trapFocus: function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (!options.$elementToFocus) {
      options.$elementToFocus = options.$container;
    }

    options.$container.attr('tabindex', '-1');
    options.$elementToFocus.focus();

    $(document).off('focusin');

    $(document).on(eventName, function(evt) {
      if (options.$container[0] !== evt.target && !options.$container.has(evt.target).length) {
        options.$container.focus();
      }
    });
  },

  /**
   * Removes the trap of focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  removeTrapFocus: function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (options.$container && options.$container.length) {
      options.$container.removeAttr('tabindex');
    }

    $(document).off(eventName);
  },


  // Not from Slate, but fit in the a11y category
  lockMobileScrolling: function(namespace, $element) {
    if ($element) {
      var $el = $element;
    } else {
      var $el = $(document.documentElement).add('body');
    }
    $el.on('touchmove' + namespace, function () {
      return false;
    });
  },

  unlockMobileScrolling: function(namespace, $element) {
    if ($element) {
      var $el = $element;
    } else {
      var $el = $(document.documentElement).add('body');
    }
    $el.off(namespace);
  }
};

theme.Sections = function Sections() {
  this.constructors = {};
  this.instances = [];

  $(document)
    .on('shopify:section:load', this._onSectionLoad.bind(this))
    .on('shopify:section:unload', this._onSectionUnload.bind(this))
    .on('shopify:section:select', this._onSelect.bind(this))
    .on('shopify:section:deselect', this._onDeselect.bind(this))
    .on('shopify:block:select', this._onBlockSelect.bind(this))
    .on('shopify:block:deselect', this._onBlockDeselect.bind(this));
};

theme.Sections.prototype = $.extend({}, theme.Sections.prototype, {
  createInstance: function(container, constructor) {
    var $container = $(container);
    var id = $container.attr('data-section-id');
    var type = $container.attr('data-section-type');

    constructor = constructor || this.constructors[type];

    if (typeof constructor === 'undefined') {
      return;
    }

    var instance = $.extend(new constructor(container), {
      id: id,
      type: type,
      container: container
    });

    this.instances.push(instance);
  },

  _onSectionLoad: function(evt) {
    var container = $('[data-section-id]', evt.target)[0];
    if (!container) {
      return;
    }

    this.createInstance(container);

    var instance = this._findInstance(evt.detail.sectionId);

    // Run JS only in case of the section being selected in the editor
    // before merchant clicks "Add"
    if (instance && typeof instance.onLoad === 'function') {
      instance.onLoad(evt);
    }
  },

  _onSectionUnload: function(evt) {
    var instance = this._removeInstance(evt.detail.sectionId);
    if (instance && typeof instance.onUnload === 'function') {
      instance.onUnload(evt);
    }
  },

  _onSelect: function(evt) {
    var instance = this._findInstance(evt.detail.sectionId);

    if (instance && typeof instance.onSelect === 'function') {
      instance.onSelect(evt);
    }
  },

  _onDeselect: function(evt) {
    var instance = this._findInstance(evt.detail.sectionId);

    if (instance && typeof instance.onDeselect === 'function') {
      instance.onDeselect(evt);
    }
  },

  _onBlockSelect: function(evt) {
    var instance = this._findInstance(evt.detail.sectionId);

    if (instance && typeof instance.onBlockSelect === 'function') {
      instance.onBlockSelect(evt);
    }
  },

  _onBlockDeselect: function(evt) {
    var instance = this._findInstance(evt.detail.sectionId);

    if (instance && typeof instance.onBlockDeselect === 'function') {
      instance.onBlockDeselect(evt);
    }
  },

  _findInstance: function(id) {
    for (var i = 0; i < this.instances.length; i++) {
      if (this.instances[i].id === id) {
        return this.instances[i];
      }
    }
  },

  _removeInstance: function(id) {
    var i = this.instances.length;
    var instance;

    while(i--) {
      if (this.instances[i].id === id) {
        instance = this.instances[i];
        this.instances.splice(i, 1);
        break;
      }
    }

    return instance;
  },

  register: function(type, constructor) {
    this.constructors[type] = constructor;

    $('[data-section-type=' + type + ']').each(function(index, container) {
      this.createInstance(container, constructor);
    }.bind(this));
  }
});


/**
 * Currency Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help with currency formatting
 *
 * Current contents
 * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
 *
 * Alternatives
 * - Accounting.js - http://openexchangerates.github.io/accounting.js/
 *
 */

theme.Currency = (function() {
  var moneyFormat = '$';

  function formatMoney(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = (format || moneyFormat);

    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = slate.utils.defaultTo(precision, 2);
      thousands = slate.utils.defaultTo(thousands, ',');
      decimal = slate.utils.defaultTo(decimal, '.');

      if (isNaN(number) || number == null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      var parts = number.split('.');
      var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      var centsAmount = parts[1] ? (decimal + parts[1]) : '';

      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        value = formatWithDelimiters(cents, 0, ' ');
        break;
    }

    return formatString.replace(placeholderRegex, value);
  }

  return {
    formatMoney: formatMoney
  }
})();


/**
 * Image Helper Functions
 * -----------------------------------------------------------------------------
 * A collection of functions that help with basic image operations.
 *
 */

theme.Images = (function() {

  /**
   * Preloads an image in memory and uses the browsers cache to store it until needed.
   *
   * @param {Array} images - A list of image urls
   * @param {String} size - A shopify image size attribute
   */

  function preload(images, size) {
    if (typeof images === 'string') {
      images = [images];
    }

    for (var i = 0; i < images.length; i++) {
      var image = images[i];
      this.loadImage(this.getSizedImageUrl(image, size));
    }
  }

  /**
   * Loads and caches an image in the browsers cache.
   * @param {string} path - An image url
   */
  function loadImage(path) {
    new Image().src = path;
  }

  /**
   * Swaps the src of an image for another OR returns the imageURL to the callback function
   * @param image
   * @param element
   * @param callback
   */
  function switchImage(image, element, callback) {
    var size = this.imageSize(element.src);
    var imageUrl = this.getSizedImageUrl(image.src, size);

    if (callback) {
      callback(imageUrl, image, element);
    } else {
      element.src = imageUrl;
    }
  }

  /**
   * Find the Shopify image attribute size
   *
   * @param {string} src
   * @returns {null}
   */
  function imageSize(src) {
    if (!src) {
      return '620x'; // default based on theme
    }

    var match = src.match(/.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/);

    if (match !== null) {
      return match[1];
    } else {
      return null;
    }
  }

  /**
   * Adds a Shopify size attribute to a URL
   *
   * @param src
   * @param size
   * @returns {*}
   */
  function getSizedImageUrl(src, size) {
    if (size == null) {
      return src;
    }

    if (size === 'master') {
      return this.removeProtocol(src);
    }

    var match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);

    if (match != null) {
      var prefix = src.split(match[0]);
      var suffix = match[0];

      return this.removeProtocol(prefix[0] + '_' + size + suffix);
    }

    return null;
  }

  function removeProtocol(path) {
    return path.replace(/http(s)?:/, '');
  }

  return {
    preload: preload,
    loadImage: loadImage,
    switchImage: switchImage,
    imageSize: imageSize,
    getSizedImageUrl: getSizedImageUrl,
    removeProtocol: removeProtocol
  };
})();

slate.Variants = (function() {

  function Variants(options) {
    this.$container = options.$container;
    this.product = options.product;
    this.singleOptionSelector = options.singleOptionSelector;
    this.originalSelectorId = options.originalSelectorId;
    this.enableHistoryState = options.enableHistoryState;
    this.currentVariant = this._getVariantFromOptions();

    $(this.singleOptionSelector, this.$container).on('change', this._onSelectChange.bind(this));
  }

  Variants.prototype = $.extend({}, Variants.prototype, {

    _getCurrentOptions: function() {
      var currentOptions = $.map($(this.singleOptionSelector, this.$container), function(element) {
        var $element = $(element);
        var type = $element.attr('type');
        var currentOption = {};

        if (type === 'radio' || type === 'checkbox') {
          if ($element[0].checked) {
            currentOption.value = $element.val();
            currentOption.index = $element.data('index');

            return currentOption;
          } else {
            return false;
          }
        } else {
          currentOption.value = $element.val();
          currentOption.index = $element.data('index');

          return currentOption;
        }
      });

      // remove any unchecked input values if using radio buttons or checkboxes
      currentOptions = this._compact(currentOptions);

      return currentOptions;
    },

    _getVariantFromOptions: function() {
      var selectedValues = this._getCurrentOptions();
      var variants = this.product.variants;
      var found = false;

      variants.forEach(function(variant) {
        var match = true;
        var options = variant.options;

        selectedValues.forEach(function(option) {
          // console.log('try to match ' + option.value + ' with ' + variant[option.index]);

          if (match) {
            match = (variant[option.index] === option.value);
          }
        });

        if (match) {
          found = variant;
        }
      });

      return found || null;
    },

    _onSelectChange: function() {
      var variant = this._getVariantFromOptions();

      this.$container.trigger({
        type: 'variantChange',
        variant: variant
      });

      if (!variant) {
        return;
      }

      this._updateMasterSelect(variant);
      this._updateImages(variant);
      this._updatePrice(variant);
      this._updateSKU(variant);
      this.currentVariant = variant;

      if (this.enableHistoryState) {
        this._updateHistoryState(variant);
      }
    },

    _updateImages: function(variant) {
      var variantImage = variant.featured_image || {};
      var currentVariantImage = this.currentVariant.featured_image || {};

      if (!variant.featured_image || variantImage.src === currentVariantImage.src) {
        return;
      }

      this.$container.trigger({
        type: 'variantImageChange',
        variant: variant
      });
    },

    _updatePrice: function(variant) {
      if (variant.price === this.currentVariant.price && variant.compare_at_price === this.currentVariant.compare_at_price) {
        return;
      }

      this.$container.trigger({
        type: 'variantPriceChange',
        variant: variant
      });
    },

    _updateSKU: function(variant) {
      if (variant.sku === this.currentVariant.sku) {
        return;
      }

      this.$container.trigger({
        type: 'variantSKUChange',
        variant: variant
      });
    },

    _updateHistoryState: function(variant) {
      if (!history.replaceState || !variant) {
        return;
      }

      var newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
      window.history.replaceState({path: newurl}, '', newurl);
    },

    _updateMasterSelect: function(variant) {
      $(this.originalSelectorId, this.$container).val(variant.id);
    },

    // _.compact from lodash
    // https://github.com/lodash/lodash/blob/4d4e452ade1e78c7eb890968d851f837be37e429/compact.js
    _compact: function(array) {
      var index = -1,
          length = array == null ? 0 : array.length,
          resIndex = 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result[resIndex++] = value;
        }
      }
      return result;
    }
  });

  return Variants;
})();


/**
 * iFrames
 * -----------------------------------------------------------------------------
 * Wrap videos in div to force responsive layout.
 *
 * @namespace iframes
 */

slate.rte = {
  wrapTable: function() {
    $('.rte table').wrap('<div class="table-wrapper"></div>');
  }
};


theme.Modals = (function() {
  function Modal(id, name, options) {
    var defaults = {
      close: '.js-modal-close',
      open: '.js-modal-open-' + name,
      openClass: 'modal--is-active',
      closingClass: 'modal--is-closing',
      bodyOpenClass: 'modal-open',
      bodyOpenSolidClass: 'modal-open--solid',
      bodyClosingClass: 'modal-closing',
      closeOffContentClick: true
    };

    this.id = id;
    this.$modal = $('#' + id);

    if (!this.$modal.length) {
      return false;
    }

    this.nodes = {
      $parent: $('html').add('body'),
      $modalContent: this.$modal.find('.modal__inner')
    };

    this.config = $.extend(defaults, options);
    this.modalIsOpen = false;
    this.$focusOnOpen = this.config.focusOnOpen ? $(this.config.focusOnOpen) : this.$modal;
    this.isSolid = this.config.solid;

    this.init();
  }

  Modal.prototype.init = function() {
    var $openBtn = $(this.config.open);

    // Add aria controls
    $openBtn.attr('aria-expanded', 'false');

    $(this.config.open).on('click', this.open.bind(this));
    this.$modal.find(this.config.close).on('click', this.close.bind(this));

    // Close modal if a drawer is opened
    $('body').on('drawerOpen', function() {
      this.close();
    }.bind(this));
  };

  Modal.prototype.open = function(evt) {
    // Keep track if modal was opened from a click, or called by another function
    var externalCall = false;

    // don't open an opened modal
    if (this.modalIsOpen) {
      return;
    }

    // Prevent following href if link is clicked
    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    // Without this, the modal opens, the click event bubbles up to $nodes.page
    // which closes the modal.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      // save the source of the click, we'll focus to this on close
      this.$activeSource = $(evt.currentTarget);
    }

    if (this.modalIsOpen && !externalCall) {
      this.close();
    }

    this.$modal
      .prepareTransition()
      .addClass(this.config.openClass);
    this.nodes.$parent.addClass(this.config.bodyOpenClass);

    if (this.isSolid) {
      this.nodes.$parent.addClass(this.config.bodyOpenSolidClass);
    }

    this.modalIsOpen = true;

    slate.a11y.trapFocus({
      $container: this.$modal,
      $elementToFocus: this.$focusOnOpen,
      namespace: 'modal_focus'
    });

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'true');
    }

    $('body').trigger('modalOpen.' + this.id);

    this.bindEvents();
  };

  Modal.prototype.close = function() {
    // don't close a closed modal
    if (!this.modalIsOpen) {
      return;
    }

    // deselect any focused form elements
    $(document.activeElement).trigger('blur');

    this.$modal
      .prepareTransition()
      .removeClass(this.config.openClass)
      .addClass(this.config.closingClass);
    this.nodes.$parent.removeClass(this.config.bodyOpenClass);
    this.nodes.$parent.addClass(this.config.bodyClosingClass);
    var o = this;
    window.setTimeout(function() {
      o.nodes.$parent.removeClass(o.config.bodyClosingClass);
      o.$modal.removeClass(o.config.closingClass);
    }, 500); // modal close css transition

    if (this.isSolid) {
      this.nodes.$parent.removeClass(this.config.bodyOpenSolidClass);
    }

    this.modalIsOpen = false;

    slate.a11y.removeTrapFocus({
      $container: this.$modal,
      namespace: 'modal_focus'
    });

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'false').focus();
    }

    $('body').trigger('modalClose.' + this.id);

    this.unbindEvents();
  };

  Modal.prototype.bindEvents = function() {
    // Pressing escape closes modal
    this.nodes.$parent.on('keyup.modal', function(evt) {
      if (evt.keyCode === 27) {
        this.close();
      }
    }.bind(this));

    if (this.config.closeOffContentClick) {
      // Clicking outside of the modal content also closes it
      this.$modal.on('click.modal', this.close.bind(this));

      // Exception to above: clicking anywhere on the modal content will NOT close it
      this.nodes.$modalContent.on('click.modal', function(evt) {
        evt.stopImmediatePropagation();
      });
    }
  };

  Modal.prototype.unbindEvents = function() {
    this.nodes.$parent.off('.modal');

    if (this.config.closeOffContentClick) {
      this.$modal.off('.modal');
      this.nodes.$modalContent.off('.modal');
    }
  };

  return Modal;
})();

theme.Drawers = (function() {
  function Drawer(id, name) {
    this.config = {
      id: id,
      close: '.js-drawer-close',
      open: '.js-drawer-open-' + name,
      openClass: 'js-drawer-open',
      closingClass: 'js-drawer-closing',
      activeDrawer: 'drawer--is-open',
      namespace: '.drawer-' + name
    };

    this.$nodes = {
      parent: $(document.documentElement).add('body'),
      page: $('#MainContent')
    };

    this.$drawer = $('#' + id);

    if (!this.$drawer.length) {
      return false;
    }

    this.isOpen = false;
    this.init();
  };

  Drawer.prototype = $.extend({}, Drawer.prototype, {
    init: function() {
      var $openBtn = $(this.config.open);

      // Add aria controls
      $openBtn.attr('aria-expanded', 'false');

      $openBtn.on('click', this.open.bind(this));
      this.$drawer.find(this.config.close).on('click', this.close.bind(this));
    },

    open: function(evt) {
      if (evt) {
        evt.preventDefault();
      }

      if (this.isOpen) {
        return;
      }

      // Without this the drawer opens, the click event bubbles up to $nodes.page which closes the drawer.
      if (evt && evt.stopPropagation) {
        evt.stopPropagation();
        // save the source of the click, we'll focus to this on close
        this.$activeSource = $(evt.currentTarget);
      }

      this.$drawer.prepareTransition().addClass(this.config.activeDrawer);

      this.$nodes.parent.addClass(this.config.openClass);
      this.isOpen = true;

      slate.a11y.trapFocus({
        $container: this.$drawer,
        namespace: 'drawer_focus'
      });

      $('body').trigger('drawerOpen.' + this.config.id);

      if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
        this.$activeSource.attr('aria-expanded', 'true');
      }

      this.bindEvents();
    },

    close: function() {
      if (!this.isOpen) {
        return;
      }

      // deselect any focused form elements
      $(document.activeElement).trigger('blur');

      this.$drawer.prepareTransition().removeClass(this.config.activeDrawer);

      this.$nodes.parent.removeClass(this.config.openClass);
      this.$nodes.parent.addClass(this.config.closingClass);
      var o = this;
      window.setTimeout(function() {
        o.$nodes.parent.removeClass(o.config.closingClass);
      }, 500);

      this.isOpen = false;

      slate.a11y.removeTrapFocus({
        $container: this.$drawer,
        namespace: 'drawer_focus'
      });

      if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
        this.$activeSource.attr('aria-expanded', 'false');
      }

      this.unbindEvents();
    },

    bindEvents: function() {
      slate.a11y.lockMobileScrolling(this.config.namespace, this.$nodes.page);

      // Clicking out of drawer closes it
      this.$nodes.page.on('click' + this.config.namespace, function () {
        this.close();
        return false;
      }.bind(this));

      // Pressing escape closes drawer
      this.$nodes.parent.on('keyup' + this.config.namespace, function(evt) {
        if (evt.keyCode === 27) {
          this.close();
        }
      }.bind(this));
    },

    unbindEvents: function() {
      slate.a11y.unlockMobileScrolling(this.config.namespace, this.$nodes.page);
      this.$nodes.parent.off(this.config.namespace);
    }
  });

  return Drawer;
})();

theme.cart = {
  getCart: function() {
    return $.getJSON('/cart.js');
  },

  changeItem: function(key, qty) {
    return this._updateCart({
      type: 'POST',
      url: '/cart/change.js',
      data: 'quantity=' + qty + '&id=' + key,
      dataType: 'json'
    });
  },

  addItemFromForm: function(data) {
    return this._updateCart({
      type: 'POST',
      url: '/cart/add.js',
      data: data,
      dataType: 'json'
    });
  },

  _updateCart: function(params) {
    return $.ajax(params)
      .then(function(cart) {
        return cart;
      }.bind(this))
  },

  updateNote: function(note) {
    var params = {
      type: 'POST',
      url: '/cart/update.js',
      data: 'note=' + cart.attributeToString(note),
      dataType: 'json',
      success: function(cart) {},
      error: function(XMLHttpRequest, textStatus) {}
    };

    $.ajax(params);
  },

  attributeToString: function(attribute) {
    if ((typeof attribute) !== 'string') {
      attribute += '';
      if (attribute === 'undefined') {
        attribute = '';
      }
    }
    return $.trim(attribute);
  }
}

$(function() {
  // Add a loading indicator on the cart checkout button (/cart and drawer)
  $('body').on('click', '.cart__checkout', function() {
    $(this).addClass('btn--loading');
  });

  $('body').on('change', 'textarea[name="note"]', function() {
    var newNote = $(this).val();
    cart.updateNote(newNote);
  });
});

theme.QtySelector = (function() {
  var classes = {
    input: '.js-qty__num',
    plus: '.js-qty__adjust--plus',
    minus: '.js-qty__adjust--minus'
  };

  function QtySelector($el, options) {
    this.$wrapper = $el;
    this.$originalInput = $el.find('input[type="number"]');
    this.minValue = this.$originalInput.attr('min') || 1;

    var defaults = {
      namespace: null
    };

    this.options = $.extend(defaults, options);

    this.source = $('#JsQty').html();
    this.template = Handlebars.compile(this.source);

    var quantities = {
      current: this._getOriginalQty(),
      add: this._getOriginalQty() + 1,
      minus: this._getOriginalQty() - 1
    };

    this.data = {
      key: this._getProductKey(),
      itemQty: quantities.current,
      itemAdd: quantities.add,
      itemMinus: quantities.minus,
      inputName: this._getInputName(),
      inputId: this._getId()
    }

    // Append new quantity selector then remove original
    this.$originalInput.after(this.template(this.data)).remove();
    this.$input = this.$wrapper.find(classes.input);
    this.$plus = this.$wrapper.find(classes.plus);
    this.$minus = this.$wrapper.find(classes.minus);

    this.initEventListeners();
  };

  QtySelector.prototype = $.extend({}, QtySelector.prototype, {
    _getProductKey: function() {
      return this.$originalInput.data('id') || null;
    },

    _getOriginalQty: function() {
      return parseInt(this.$originalInput.val());
    },

    _getInputName: function() {
      return this.$originalInput.attr('name');
    },

    _getId: function() {
      return this.$originalInput.attr('id');
    },

    initEventListeners: function() {
      this.$plus.on('click', function() {
        var qty = this.validateQty(this.$input.val());
        this.addQty(qty);
      }.bind(this));

      this.$minus.on('click', function() {
        var qty = this.validateQty(this.$input.val());
        this.subtractQty(qty);
      }.bind(this));

      this.$input.on('change', function() {
        var qty = this.validateQty(this.$input.val());
        this.changeQty(qty);
      }.bind(this));
    },

    addQty: function(number) {
      var qty = number + 1;
      this.changeQty(qty);
    },

    subtractQty: function(number) {
      var qty = number - 1;
      if (qty <= this.minValue) {
        qty = this.minValue;
      }
      this.changeQty(qty);
    },

    changeQty: function(qty) {
      this.$input.val(qty);
      $('body').trigger('qty' + this.options.namespace, [this.data.key, qty]);
    },

    validateQty: function(number) {
      if((parseFloat(number) == parseInt(number)) && !isNaN(number)) {
        // We have a valid number!
      } else {
        // Not a number. Default to 1.
        number = 1;
      }
      return parseInt(number);
    }
  });

  return QtySelector;
})();

theme.CartDrawer = (function() {
  var config = {
    namespace: '.ajaxcart'
  };

  var selectors = {
    drawer: '#CartDrawer',
    container: '#CartContainer',
    template: '#CartTemplate',
    fixedFooter: '.drawer__footer--fixed',
    fixedInnerContent: '.drawer__inner--has-fixed-footer',
    cartBubble: '.cart-link__bubble'
  };

  function CartDrawer() {
    this.status = {
      loaded: false,
      loading: false
    };

    this.qtySelectors = [];

    this.drawer = new theme.Drawers('CartDrawer', 'cart');

    // Prep handlebars template
    var source = $(selectors.template).html();
    this.template = Handlebars.compile(source);

    // Build cart on page load so it's ready in the drawer
    if (!theme.config.isIframe) {
      theme.cart.getCart().then(this.buildCart.bind(this));
    }

    this.initEventListeners();
  };

  CartDrawer.prototype = $.extend({}, CartDrawer.prototype, {
    initEventListeners: function() {
      $('body').on('updateCart' + config.namespace, this.initQtySelectors.bind(this));
      $('body').on('updateCart' + config.namespace, this.sizeFooter.bind(this));
      $('body').on('updateCart' + config.namespace, this.updateCartNotification.bind(this));
      $('body').on('drawerOpen.CartDrawer', this.sizeFooter.bind(this));

      $(window).on('resize' + config.namespace, $.debounce(150, this.sizeFooter.bind(this)));

      $('body').on('added.ajaxProduct', function() {
        theme.cart.getCart().then(function(cart) {
          this.buildCart(cart, true);
        }.bind(this));
      }.bind(this));
    },

    buildCart: function(cart, openDrawer) {
      this.loading(true);
      this.emptyCart();

      if (cart.item_count === 0) {
        $(selectors.container).append('<p class="appear-animation appear-delay-3">' + theme.strings.cartEmpty +'</p>');
      } else {
        var items = [];
        var item = {};
        var data = {};
        var animation_row = 1;

        $.each(cart.items, function(index, product) {

          var prodImg;
          if (product.image !== null) {
            prodImg = product.image.replace(/(\.[^.]*)$/, "_180x$1");
          } else {
            prodImg = '//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif';
          }

          if (product.properties !== null) {
            $.each(product.properties, function(key, value) {
              if (key.charAt(0) === '_' || !value) {
                 delete product.properties[key];
               }
            });
          }

          animation_row+=2;

          item = {
            key: product.key,
            url: product.url,
            img: prodImg,
            animationRow: animation_row,
            name: product.product_title,
            variation: product.variant_title,
            properties: product.properties,
            itemQty: product.quantity,
            price: theme.Currency.formatMoney(product.price, theme.settings.moneyFormat),
            discountedPrice: theme.Currency.formatMoney((product.price - (product.total_discount/product.quantity)), theme.settings.moneyFormat),
            discounts: product.discounts,
            discountsApplied: product.price === (product.price - product.total_discount) ? false : true,
            vendor: product.vendor
          };

          items.push(item);
        });

        animation_row+=2;

        data = {
          items: items,
          note: cart.note,
          lastAnimationRow: animation_row,
          totalPrice: theme.Currency.formatMoney(cart.total_price, theme.settings.moneyFormat),
          totalCartDiscount: cart.total_discount === 0 ? 0 : theme.strings.cartSavings.replace('[savings]', theme.Currency.formatMoney(cart.total_discount, theme.settings.moneyFormat))
        };

        $(selectors.container).append(this.template(data));
      }

      this.status.loaded = true;
      this.loading(false);

      if ($('body').hasClass('currencies-enabled')) {
        theme.currencySwitcher.ajaxrefresh();
      }

      $('body').trigger('updateCart' + config.namespace, cart);

      // If specifically asked, open the cart drawer (only happens after product added from form)
      if (openDrawer === true) {
        this.drawer.open();
      }
    },

    initQtySelectors: function() {
      this.qtySelectors = [];

      $(selectors.container).find('.js-qty').each(function(index, el) {
        var selector = new theme.QtySelector($(el), {
          namespace: '.cart-drawer'
        });
        this.qtySelectors.push(selector);
      }.bind(this));

      $('body').on('qty.cart-drawer', this.updateItem.bind(this));
    },

    updateItem: function(evt, key, qty) {
      if (this.status.loading) {
        return;
      }

      this.loading(true);

      theme.cart.changeItem(key, qty)
        .then(function(cart) {
          this.updateSuccess(cart);
        }.bind(this))
        .catch(function(XMLHttpRequest) {
          this.updateError(XMLHttpRequest)
        }.bind(this))
        .always(function() {
          this.loading(false);
        }.bind(this));
    },

    loading: function(state) {
      this.status.loading = state;

      if (state) {
        $(selectors.container).addClass('is-loading');
      } else {
        $(selectors.container).removeClass('is-loading');
      }
    },

    emptyCart: function() {
      $(selectors.container).empty();
    },

    updateSuccess: function(cart) {
      this.buildCart(cart)
    },

    updateError: function(XMLHttpRequest) {
      if (XMLHttpRequest.responseJSON && XMLHttpRequest.responseJSON.description) {
        console.warn(XMLHttpRequest.responseJSON.description);
      }
    },

    // Update elements after cart is updated
    sizeFooter: function() {
      // Stop if our drawer doesn't have a fixed footer
      if (!$(selectors.drawer).hasClass('drawer--has-fixed-footer')) {
        return;
      }

      // Elements are reprinted regularly so selectors are not cached
      var $cartFooter = $(selectors.drawer).find(selectors.fixedFooter).removeAttr('style');
      var $cartInner = $(selectors.drawer).find(selectors.fixedInnerContent).removeAttr('style');
      var cartFooterHeight = $cartFooter.outerHeight();

      $cartInner.css('bottom', cartFooterHeight);
      $cartFooter.css('height', cartFooterHeight);
    },

    updateCartNotification: function(evt, cart) {
      if (cart.items.length > 0) {
        $(selectors.cartBubble).addClass('cart-link__bubble--visible');
      } else {
        $(selectors.cartBubble).removeClass('cart-link__bubble--visible');
      }
    }
  });

  return CartDrawer;
})();

theme.AjaxProduct = (function() {
  var status = {
    loading: false
  };

  function ProductForm($form) {
    this.$form = $form;
    this.$addToCart = this.$form.find('.add-to-cart');

    if (this.$form.length) {
      this.$form.on('submit', this.addItemFromForm.bind(this));
    }
  };

  ProductForm.prototype = $.extend({}, ProductForm.prototype, {
    addItemFromForm: function(evt, callback){
      evt.preventDefault();

      if (status.loading) {
        console.warn('already adding item to cart | bail');
        return;
      }

      // Loading indicator on add to cart button
      this.$addToCart.addClass('btn--loading');

      status.loading = true;

      var data = this.$form.serialize();

      theme.cart.addItemFromForm(data)
        .then(function(product) {
          this.success(product);
        }.bind(this))
        .catch(function(XMLHttpRequest) {
          this.error(XMLHttpRequest)
        }.bind(this))
        .always(function() {
          status.loading = false;
          this.$addToCart.removeClass('btn--loading');
        }.bind(this));
    },

    success: function(product) {
      this.$form.find('.errors').remove();
      $('body').trigger('added.ajaxProduct');
    },

    error: function(XMLHttpRequest) {
      this.$form.find('.errors').remove();

      if (XMLHttpRequest.responseJSON && XMLHttpRequest.responseJSON.description) {
        console.warn(XMLHttpRequest.responseJSON.description);

        this.$form.prepend('<div class="errors text-center">' + XMLHttpRequest.responseJSON.description + '</div>');
      }
    }
  });

  return ProductForm;
})();

theme.collapsibles = (function() {

  var selectors = {
    trigger: '.collapsible-trigger',
    module: '.collapsible-content',
    moduleInner: '.collapsible-content__inner'
  };

  var classes = {
    hide: 'hide',
    open: 'is-open',
    autoHeight: 'collapsible--auto-height'
  };

  var isTransitioning = false;

  function init() {
    $(selectors.trigger).each(function() {
      var $el = $(this);
      var state = $el.hasClass(classes.open);
      $el.attr('aria-expanded', state);
    });

    // Event listeners (hack for modals)
    $('body, .modal__inner').on('click', selectors.trigger, function() {
      if (isTransitioning) {
        return;
      }

      isTransitioning = true;

      var $el = $(this);
      var isOpen = $el.hasClass(classes.open);
      var moduleId = $el.attr('aria-controls');
      var $module = $('#' + moduleId);
      var height = $module.find(selectors.moduleInner).outerHeight();
      var isAutoHeight = $el.hasClass(classes.autoHeight);

      // If isAutoHeight, set the height to 0 just after setting the actual height
      // so the closing animation works nicely
      if (isOpen && isAutoHeight) {
        setTimeout(function() {
          height = 0;
          setTransitionHeight($module, height, isOpen, isAutoHeight);
        }, 0);
      }

      if (isOpen && !isAutoHeight) {
        height = 0;
      }

      $el
        .attr('aria-expanded', !isOpen)
        .toggleClass(classes.open, !isOpen);

      setTransitionHeight($module, height, isOpen, isAutoHeight);
    });
  }

  function setTransitionHeight($module, height, isOpen, isAutoHeight) {
    $module
      .removeClass(classes.hide)
      .prepareTransition()
      .css('height', height)
      .toggleClass(classes.open, !isOpen);

    if (!isOpen && isAutoHeight) {
      var o = $module;
      window.setTimeout(function() {
        o.css('height','auto');
        isTransitioning = false;
      }, 500);
    } else {
      isTransitioning = false;
    }
  }

  return {
    init: init
  };
})();

theme.headerNav = (function() {

  var $parent = $(document.documentElement).add('body');
  var $page = $('#MainContent');
  var selectors = {
    wrapper: '.header-wrapper',
    siteHeader: '.site-header',
    searchBtn: '.js-search-header',
    closeSearch: '.js-search-header-close',
    searchContainer: '.site-header__search-container',
    logoContainer: '.site-header__logo',
    logo: '.site-header__logo img',
    navigation: '.site-navigation',
    navContainerWithLogo: '.header-item--logo',
    navLinks: '.site-nav__link',
    navDropdownLinks: '.site-nav__dropdown-link--second-level',

    hasDropdownClass: 'site-nav--has-dropdown',
    hasSubDropdownClass: 'site-nav__deep-dropdown-trigger',
    reverseLastDropdown: 'header-item--reverse'
  };

  var config = {
    namespace: '.siteNav',
    wrapperOverlayed: false,
    overlayedClass: 'is-light',
    stickyEnabled: false,
    stickyActive: false,
    stickyClass: 'site-header--stuck',
    openTransitionClass: 'site-header--opening',
    lastScroll: 0
  };

  // Elements used in resize functions, defined in init
  var $window;
  var $navContainerWithLogo;
  var $logoContainer;
  var $nav;
  var $wrapper;
  var $siteHeader;

  function init() {
    $window = $(window);
    $navContainerWithLogo = $(selectors.navContainerWithLogo);
    $logoContainer = $(selectors.logoContainer);
    $nav = $(selectors.navigation);
    $wrapper = $(selectors.wrapper);
    $siteHeader = $(selectors.siteHeader);

    var enableFitNav = $(selectors.navigation).hasClass('site-nav--activate-compress');

    if (enableFitNav) {
      fitNav();
      $window.on('load' + config.namespace, fitNav);
      $window.on('resize' + config.namespace, $.debounce(150, fitNav));
    }

    config.stickyEnabled = $siteHeader.data('sticky');
    if (config.stickyEnabled) {
      config.wrapperOverlayed = $wrapper.hasClass(config.overlayedClass);
      stickyHeader();
    }

    accessibleDropdowns();
    searchDrawer();

    $window.on('load' + config.namespace, resizeLogo);
    $window.on('resize' + config.namespace, $.debounce(150, resizeLogo));
  }

  function unload() {
    $(window).off(config.namespace);
    $(selectors.searchBtn).off(config.namespace);
    $(selectors.closeSearch).off(config.namespace);
    $parent.off(config.namespace);
    $(selectors.navLinks).off(config.namespace);
    $(selectors.navDropdownLinks).off(config.namespace);
  }

  function searchDrawer() {
    $(selectors.searchBtn).on('click' + config.namespace, function(evt) {
      evt.preventDefault();
      openSearchDrawer();
    });

    $(selectors.closeSearch).on('click' + config.namespace, function() {
      closeSearchDrawer();
    });
  }

  function openSearchDrawer() {
    $(selectors.searchContainer).addClass('is-active');
    $parent.addClass('js-drawer-open js-drawer-open--search');

    slate.a11y.trapFocus({
      $container: $(selectors.searchContainer),
      namespace: 'header_search',
      $elementToFocus: $(selectors.searchContainer).find('input')
    });

    // If sticky is enabled, scroll to top on mobile when close to it
    // so you don't get an invisible search box
    if (theme.config.bpSmall && config.stickyEnabled && config.lastScroll < 300) {
      window.scrollTo(0,0);
    }

    // Bind events
    slate.a11y.lockMobileScrolling(config.namespace);

    // Clicking out of container closes it
    $page.on('click' + config.namespace, function () {
      closeSearchDrawer();
      return false;
    });

    $parent.on('keyup' + config.namespace, function(evt) {
      if (evt.keyCode === 27) {
        closeSearchDrawer();
      }
    });
  }

  function closeSearchDrawer() {
    // deselect any focused form elements
    $(document.activeElement).trigger('blur');

    $parent.removeClass('js-drawer-open js-drawer-open--search').off(config.namespace);
    $(selectors.searchContainer).removeClass('is-active');

    slate.a11y.removeTrapFocus({
      $container: $(selectors.searchContainer),
      namespace: 'header_search'
    });

    slate.a11y.unlockMobileScrolling(config.namespace);
    $page.off('click' + config.namespace);
    $parent.off('keyup' + config.namespace);
  }

  function resizeLogo() {
    // Using .each() as there can be a reversed logo too
    $(selectors.logo).each(function() {
      var $el = $(this),
          logoWidthOnScreen = $el.width(),
          containerWidth = $el.closest('.grid__item').width();
      // If image exceeds container, let's make it smaller
      if (logoWidthOnScreen > containerWidth) {
        $el.css('maxWidth', containerWidth);
      }
      else {
        $el.removeAttr('style');
      }
    });
  }

  function fitNav() {
    // Measure children of site nav on load and resize.
    // If wider than parent (minus logo), switch to mobile nav.
    // Subtract 20 from width to account for inline-block spacing
    var availableNavSpace = $navContainerWithLogo.width() - $logoContainer.outerWidth() - 20;
    var navItemWidth = 0;
    $nav.find('> li').each(function() {
      var $el = $(this);
      if (!$el.hasClass('site-nav--compress__menu')) {
        // Round up to be safe
        navItemWidth += Math.ceil($(this).width());
      }
    });

    // Set class to make third level nav float to left so it stays in the screen
    if ((availableNavSpace - navItemWidth) < 180) {
      $navContainerWithLogo.addClass(selectors.reverseLastDropdown)
    } else {
      $navContainerWithLogo.removeClass(selectors.reverseLastDropdown)
    }

    if (navItemWidth > availableNavSpace) {
      $wrapper.addClass('site-nav--compress');
    } else {
      $wrapper.removeClass('site-nav--compress');
    }
  }

  function accessibleDropdowns() {
    var hasActiveDropdown = false;
    var hasActiveSubDropdown = false;

    // Open/hide top level dropdowns
    $(selectors.navLinks).on('focusin' + config.namespace, function() {
      if (hasActiveDropdown) {
        closeSecondLevelDropdown();
      }

      if (hasActiveSubDropdown) {
        closeThirdLevelDropdown();
      }

      if ($(this).parent().hasClass(selectors.hasDropdownClass)) {
        $(this).addClass('is-focused');
        hasActiveDropdown = true;
      }
    });

    // Open/hide sub level dropdowns
    $(selectors.navDropdownLinks).on('focusin' + config.namespace, function() {
      if (hasActiveSubDropdown) {
        closeThirdLevelDropdown();
      }

      if ($(this).parent().hasClass(selectors.hasSubDropdownClass)) {
        $(this).addClass('is-focused');
        hasActiveSubDropdown = true;
      }
    });

    // Private dropdown methods
    function closeSecondLevelDropdown() {
      $(selectors.navLinks).removeClass('is-focused');
    }

    function closeThirdLevelDropdown() {
      $(selectors.navDropdownLinks).removeClass('is-focused');
    }
  }

  function stickyHeader() {
    config.lastScroll = 0;
    $siteHeader.wrap('<div class="site-header-sticky"></div>');
    var $stickyHeader = $('.site-header-sticky').css('height', $siteHeader.outerHeight(true));

    $window.on('scroll' + config.namespace, $.throttle(15, stickyHeaderScroll));
  }

  function stickyHeaderScroll() {
    var scroll = $window.scrollTop();
    var threshold = 250;

    if (scroll > threshold) {
      if (config.stickyActive) {
        return;
      }

      config.stickyActive = true;

      $siteHeader.addClass(config.stickyClass);
      if (config.wrapperOverlayed) {
        $wrapper.removeClass(config.overlayedClass);
      }

      // Add open transition class after element is set to fixed
      // so CSS animation is applied correctly
      setTimeout(function() {
        $siteHeader.addClass(config.openTransitionClass);
      }, 100);
    } else {
      if (!config.stickyActive) {
        return;
      }

      config.stickyActive = false;

      $siteHeader.removeClass(config.openTransitionClass).removeClass(config.stickyClass);
      if (config.wrapperOverlayed) {
        $wrapper.addClass(config.overlayedClass);
      }
    }

    config.lastScroll = scroll;
  }

  return {
    init: init,
    unload: unload
  };
})();

theme.articleImages = (function() {

  var cache = {};

  function init() {
    cache.$rteImages = $('.rte--indented-images');

    if (!cache.$rteImages.length) {
      return;
    }

    $(window).on('load', setImages);
  }

  function setImages() {
    cache.$rteImages.find('img').each(function() {
      var $el = $(this);
      var attr = $el.attr('style');

      // Check if undefined or float: none
      if (!attr || attr == 'float: none;') {
        // Remove grid-breaking styles if image isn't wider than parent
        if ($el.width() < cache.$rteImages.width()) {
          $el.addClass('rte__no-indent');
        }
      }
    });
  }

  return {
    init: init
  };
})();

theme.backButton = (function() {

  function init() {
    if (!document.referrer || !$('.return-link').length || !window.history.length) {
      return;
    }

    //$('.return-link').on('click', backHistory);
  }

  function backHistory() {
    var referrerDomain = urlDomain(document.referrer);
    var shopDomain = urlDomain(document.url);

    if (shopDomain === referrerDomain) {
      history.back();
      return false;
    }
  }

  function urlDomain(url) {
    var    a      = document.createElement('a');
           a.href = url;
    return a.hostname;
  }

  return {
    init: init
  };
})();

theme.Slideshow = (function() {
  this.$slideshow = null;

  var classes = {
    next: 'is-next',
    init: 'is-init',
    header: 'header-wrapper',
    wrapper: 'slideshow-wrapper',
    slideshow: 'slideshow',
    currentSlide: 'slick-current',
    pauseButton: 'slideshow__pause',
    isPaused: 'is-paused'
  };

  function slideshow(el, args) {
    this.$slideshow = $(el);
    this.$wrapper = this.$slideshow.closest('.' + classes.wrapper);
    this.$pause = this.$wrapper.find('.' + classes.pauseButton);

    this.settings = {
      accessibility: true,
      arrows: false,
      dots: false,
      // fade: true,
      draggable: true,
      touchThreshold: 5,
      pauseonHover: false,
      autoplay: this.$slideshow.data('autoplay'),
      autoplaySpeed: this.$slideshow.data('speed')
    };

    this.$slideshow.on('init', this.init.bind(this));

    this.$slideshow.slick(this.settings);

    this.$pause.on('click', this._togglePause.bind(this));
  }

  slideshow.prototype = $.extend({}, slideshow.prototype, {
    init: function(event, obj) {
      this.$slideshowList = obj.$list;
      this.$slickDots = obj.$dots;
      this.$allSlides = obj.$slides;
      this.slideCount = obj.slideCount;

      this.$slideshow.addClass(classes.init);
      // this._currentSlide().addClass('is-first');
      this._a11y();
    },
    destroy: function() {
      this.$slideshow.slick('unslick');
    },

    // Playback
    _play: function() {
      this.$slideshow.slick('slickPause');
      $(classes.pauseButton).addClass('is-paused');
    },
    _pause: function() {
      this.$slideshow.slick('slickPlay');
      $(classes.pauseButton).removeClass('is-paused');
    },
    _togglePause: function() {
      var slideshowSelector = this._getSlideshowId(this.$pause);
      if (this.$pause.hasClass(classes.isPaused)) {
        this.$pause.removeClass(classes.isPaused);
        $(slideshowSelector).slick('slickPlay');
      } else {
        this.$pause.addClass(classes.isPaused);
        $(slideshowSelector).slick('slickPause');
      }
    },

    // Helpers
    _getSlideshowId: function($el) {
      return '#Slideshow-' + $el.data('id');
    },
    _activeSlide: function() {
      return this.$slideshow.find('.slick-active');
    },
    _currentSlide: function() {
      return this.$slideshow.find('.slick-current');
    },
    _nextSlide: function(index) {
      return this.$slideshow.find('.slideshow__slide[data-slick-index="' + index + '"]');
    },

    // a11y fixes
    _a11y: function() {
      var $list = this.$slideshowList;
      var autoplay = this.settings.autoplay;

      // Remove default Slick aria-live attr until slider is focused
      $list.removeAttr('aria-live');

      // When an element in the slider is focused
      // pause slideshow and set aria-live
      $(classes.wrapper).on('focusin', function(evt) {
        if (!$(classes.wrapper).has(evt.target).length) {
          return;
        }

        $list.attr('aria-live', 'polite');
        if (autoplay) {
          this._pause();
        }
      }.bind(this));

      // Resume autoplay
      $(classes.wrapper).on('focusout', function(evt) {
        if (!$(classes.wrapper).has(evt.target).length) {
          return;
        }

        $list.removeAttr('aria-live');
        if (autoplay) {
          this._play();
        }
      }.bind(this));
    }
  });

  return slideshow;
})();

theme.announcementBar = (function() {

  var selectors = {
    announcementBar: '.announcement',
    announcementText: '.announcement__text',
    announcementClose: '.announcement__close'
  }

  function init() {
    if (!$(selectors.announcementClose).length || theme.config.isIframe) {
      return;
    }

    if (theme.config.hasSessionStorage && sessionStorage[announcementBarText()] !== 'hidden') {
      window.setTimeout(function() {
        announcementBarShow();
      }, 2000);
    }

    $(selectors.announcementClose).on('click', function(evt) {
      evt.preventDefault();
      announcementBarClose();
    });
  }

  function announcementBarShow() {
    $(selectors.announcementBar).removeClass('announcement--closed');
    var barHeight = $(selectors.announcementBar).height();
    $(selectors.announcementBar).addClass('announcement--opening').prepareTransition().css({height: barHeight});
  }

  function announcementBarClose() {
    if (theme.config.hasSessionStorage) {
      sessionStorage.setItem(announcementBarText(), 'hidden');
    }

    var barHeight = $(selectors.announcementBar).height();

    $(selectors.announcementBar).addClass('announcement--closed');
  }

  function announcementBarText() {
    return $(selectors.announcementText).data('text');
  }

  return {
    init: init
  };
})();

theme.currencySwitcher = (function() {

  var selectors = {
    dataDiv: '#CurrencyData',
    picker: '.currency-input'
  };

  var data = {};

  function init() {
    var $dataDiv = $(selectors.dataDiv);

    if (!$dataDiv.length) {
      return;
    }

    $primaryPicker = $('#CurrencyPicker-header');
    $secondaryPicker = $('#CurrencyPicker-footer');

    // Keep primary and secondary currency pickers in sync
    if ($secondaryPicker.length) {
      $secondaryPicker.on('change', function() {
        $primaryPicker.val($(this).val());
      });

      $primaryPicker.on('change', function() {
        $secondaryPicker.val($(this).val());
      });
    }

    data = {
      currency: $dataDiv.data('shop-currency'),
      default: $dataDiv.data('default-currency'),
      format: $dataDiv.data('format'),
      moneyFormat: $dataDiv.data('money-format'),
      moneyCurrencyFormat: $dataDiv.data('money-currency-format')
    };

    Currency.format = data.format;

    // Rely on the shop's currency format, not Shopify defaults (in case merchant changes it)
    Currency.money_format[data.currency] = data.moneyFormat;
    Currency.money_with_currency_format[data.currency] = data.moneyCurrencyFormat;

    // Fix for customer account page
    $('span.money span.money').each(function() {
      $(this).parents('span.money').removeClass('money');
    });

    // Save current price
    $('span.money').each(function() {
      $(this).attr('data-currency-' + data.currency, $(this).html());
    });

    checkCookie();

    $(selectors.picker).val(Currency.currentCurrency).on('change', refresh);
  }

  function refresh() {
    var newCurrency = $(selectors.picker).val();
    Currency.convertAll(Currency.currentCurrency, newCurrency);
  }

  function ajaxrefresh() {
    var newCurrency = $(selectors.picker).val();
    // Ajax cart always returns shop's currency, not what theme settings defines
    Currency.convertAll(data.currency, newCurrency);
  }

  function checkCookie() {
    var cookieCurrency = Currency.cookie.read();

    if (cookieCurrency == null) {
      if (data.currency !== data.default) {
        Currency.convertAll(data.currency, data.default);
      }
      else {
        Currency.currentCurrency = data.default;
      }
    } else if ($(selectors.picker).length && $(selectors.picker).find('option[value=' + cookieCurrency + ']').length === 0) {
      // If the cookie value does not correspond to any value in the currency dropdown
      Currency.currentCurrency = data.currency;
      Currency.cookie.write(data.currency);
    }
    else if (cookieCurrency === data.currency) {
      Currency.currentCurrency = data.currency;
    }
    else {
      Currency.convertAll(data.currency, cookieCurrency);
    }
  }

  return {
    init: init,
    refresh: refresh,
    ajaxrefresh: ajaxrefresh
  };
})();

theme.initQuickShop = function() {
  $('.quick-product__btn').each(function() {
    var productId = $(this).data('product-id');
    var modalId = 'QuickShopModal-' + productId;
    var modalName = 'quick-modal-' + productId;
    new theme.Modals(modalId, modalName);
  });
};

theme.videoModal = function() {
  var videoModalPlayer = null;
  var videoOptions = {
    width: 1280,
    height: 720,
    playerVars: {
      autohide: 0,
      autoplay: 1,
      branding: 0,
      cc_load_policy: 0,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      quality: 'hd720',
      rel: 0,
      showinfo: 0,
      wmode: 'opaque'
    }
  };

  var selectors = {
    triggers: 'a[href*="youtube.com/watch"], a[href*="youtu.be/"]'
  };

  if (!$(selectors.triggers).length) {
    return;
  }

  var modal = new theme.Modals('VideoModal', 'video-modal', {
    closeOffContentClick: true,
    solid: true
  });

  // We have at least one video that may open in a modal. Prep YouTube API
  window.loadYouTube();
  $('body').on('youTubeReady', function() {
    $(selectors.triggers).on('click', startVideoOnClick);
  });

  function startVideoOnClick(evt) {
    evt.preventDefault();
    var $el = $(this);

    // get video ID from URL
    var videoId = getYoutubeVideoId($el.attr('href'));

    var args = $.extend({}, videoOptions, {
      videoId: videoId
    });

    // Disable plays inline on mobile
    args.playerVars.playsinline = theme.config.bpSmall ? 0 : 1;

    var videoModalPlayer = new YT.Player('VideoHolder', args);
    modal.open();

    $('body').on('modalClose.VideoModal', function() {
      // Slight timeout so it is destroyed after the modal closes
      setTimeout(function() {
        videoModalPlayer.destroy();
      }, 500); // modal close css transition
    });
  }

  function getYoutubeVideoId(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
  }
};



theme.customerTemplates = (function() {

  function initEventListeners() {
    // Show reset password form
    $('#RecoverPassword').on('click', function(evt) {
      evt.preventDefault();
      toggleRecoverPasswordForm();
    });

    // Hide reset password form
    $('#HideRecoverPasswordLink').on('click', function(evt) {
      evt.preventDefault();
      toggleRecoverPasswordForm();
    });
  }

  /**
   *
   *  Show/Hide recover password form
   *
   */
  function toggleRecoverPasswordForm() {
    $('#RecoverPasswordForm').toggleClass('hide');
    $('#CustomerLoginForm').toggleClass('hide');
  }

  /**
   *
   *  Show reset password success message
   *
   */
  function resetPasswordSuccess() {
    var $formState = $('.reset-password-success');

    // check if reset password form was successfully submitted
    if (!$formState.length) {
      return;
    }

    // show success message
    $('#ResetSuccess').removeClass('hide');
  }

  /**
   *
   *  Show/hide customer address forms
   *
   */
  function customerAddressForm() {
    var $newAddressForm = $('#AddressNewForm');

    if (!$newAddressForm.length) {
      return;
    }

    // Initialize observers on address selectors, defined in shopify_common.js
    if (Shopify) {
      new Shopify.CountryProvinceSelector('AddressCountryNew', 'AddressProvinceNew', {
        hideElement: 'AddressProvinceContainerNew'
      });
    }

    // Initialize each edit form's country/province selector
    $('.address-country-option').each(function() {
      var formId = $(this).data('form-id');
      var countrySelector = 'AddressCountry_' + formId;
      var provinceSelector = 'AddressProvince_' + formId;
      var containerSelector = 'AddressProvinceContainer_' + formId;

      new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
        hideElement: containerSelector
      });
    });

    // Toggle new/edit address forms
    $('.address-new-toggle').on('click', function() {
      $newAddressForm.toggleClass('hide');
    });

    $('.address-edit-toggle').on('click', function() {
      var formId = $(this).data('form-id');
      $('#EditAddress_' + formId).toggleClass('hide');
    });

    $('.address-delete').on('click', function() {
      var $el = $(this);
      var formId = $el.data('form-id');
      var confirmMessage = $el.data('confirm-message');

      if (confirm(confirmMessage || 'Are you sure you wish to delete this address?')) {
        Shopify.postLink('/account/addresses/' + formId, {parameters: {_method: 'delete'}});
      }
    });
  }

  /**
   *
   *  Check URL for reset password hash
   *
   */
  function checkUrlHash() {
    var hash = window.location.hash;

    // Allow deep linking to recover password form
    if (hash === '#recover') {
      toggleRecoverPasswordForm();
    }
  }

  return {
    init: function() {
      checkUrlHash();
      initEventListeners();
      resetPasswordSuccess();
      customerAddressForm();
    }
  };
})();


theme.Product = (function() {
  var youtubeReady;
  var videos = {};
  var youtubePlayers = [];
  var youtubeVideoOptions = {
    height: '480',
    width: '850',
    playerVars :{
      autohide: 0,
      autoplay: 1,
      branding: 0,
      cc_load_policy: 0,
      controls: 0,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      quality: 'hd720',
      rel: 0,
      showinfo: 0,
      wmode: 'opaque'
    },
    events: {
      onReady: onVideoPlayerReady,
      onStateChange: onVideoStateChange
    }
  };

  var vimeoReady;
  var vimeoPlayers = [];
  var vimeoVideoOptions = {
    byline: false,
    title: false,
    portrait: false,
    loop: true
  };

  var selectors = {
    videoParent: '.product__video-wrapper'
  };

  var classes = {
    loading: 'loading',
    loaded: 'loaded',
    currentSlide: 'slick-current',
    productVideo: 'product__video',
    zoomInit: 'photo-zoom-init'
  };

  function onVideoPlayerReady(evt) {
    var $player = $(evt.target.a);
    var playerId = $player.attr('id');
    youtubePlayers[playerId] = evt.target; // update stored player
    var player = youtubePlayers[playerId];

    setParentAsLoading($player);

    if (videos[playerId].style === 'muted') {
      youtubePlayers[playerId].mute().playVideo().pauseVideo();
    } else {
      setParentAsLoaded($player);
    }

    // If first slide or only photo, start video
    if ($player.closest('.' + classes.currentSlide).length || $player.data('image-count') === 1) {
      youtubePlayers[playerId].playVideo();
      initCheckVisibility(playerId);
    }
  }

  function initCheckVisibility(playerId) {
    // Add out of view pausing
    videoVisibilityCheck(playerId);
    $(window).on('scroll.' + playerId, {id: playerId}, $.throttle(150, videoVisibilityCheck));
  }

  function videoVisibilityCheck(id) {
    var playerId;

    if (typeof id === 'string') {
      playerId = id;
    } else {
      // Data comes in as part of the scroll event
      playerId = id.data.id;
    }

    if (theme.isElementVisible($('#' + playerId))) {
      playVisibleVideo(playerId);
    } else {
      pauseHiddenVideo(playerId);
    }
  }

  function playVisibleVideo(id) {
    if (youtubePlayers[id] && typeof youtubePlayers[id].playVideo === 'function') {
      youtubePlayers[id].playVideo();
    }
  }

  function pauseHiddenVideo(id) {
    if (youtubePlayers[id] && typeof youtubePlayers[id].pauseVideo === 'function') {
      youtubePlayers[id].pauseVideo();
    }
  }

  function onVideoStateChange(evt) {
    var $player = $(evt.target.a);
    var playerId = $player.attr('id');
    var player = youtubePlayers[playerId];

    switch (evt.data) {
      case 0: // ended
        player.playVideo();
        break;
      case 1: // playing
        setParentAsLoaded($player);
        break;
    }
  }

  function setParentAsLoading($el) {
    $el
      .closest(selectors.videoParent)
      .addClass(classes.loading);
  }

  function setParentAsLoaded($el) {
    $el
      .closest(selectors.videoParent)
      .removeClass(classes.loading)
      .addClass(classes.loaded);
  }

  function Product(container) {
    var $container = this.$container = $(container);
    var sectionId = this.sectionId = $container.attr('data-section-id');

    this.inModal = $container.closest('.modal').length;
    this.$modal;

    this.settings = {
      enableHistoryState: $container.data('enable-history-state') || false,
      namespace: '.product-' + sectionId,
      zoom: $container.data('image-zoom') || false,
      modalInit: false,
      lazyLoadModalContent: $container.data('lazyload-content') || false,
      modalContentLoaded: false,
      slickInitialized: false,
      hasColorSwatches: false,
      hasImages: true,
      hasMultipleImages: false,
      imageSize: '620x'
    };

    // Overwrite some settings when loaded in modal
    if (this.inModal) {
      this.settings.enableHistoryState = false;
      this.settings.namespace = '.product-' + sectionId + '-modal';
      this.$modal = $('#QuickShopModal-' + sectionId);
    }

    this.classes = {
      onSale: 'on-sale',
      disabled: 'disabled',
      isModal: 'is-modal'
    };

    this.selectors = {
      productJson: 'ProductJson-' + sectionId,

      video: 'ProductVideo-' + sectionId,
      photoThumbs: '.product__thumb-' + sectionId,
      thumbSlider: '#ProductThumbs-' + sectionId,
      mainSlider: '#ProductPhotos-' + sectionId,
      productVideo: '.product__video',

      priceWrapper: '.product__price-wrap-' + sectionId,
      price: '#ProductPrice-' + sectionId,
      comparePrice: '#ComparePrice-' + sectionId,
      priceA11y: '#PriceA11y-' + sectionId,
      comparePriceA11y: '#ComparePriceA11y-' + sectionId,
      sku: '#Sku-' + sectionId,

      addToCart: '#AddToCart-' + sectionId,
      addToCartText: '#AddToCartText-' + sectionId,

      originalSelectorId: '#ProductSelect-' + sectionId,
      singleOptionSelector: '.variant__input-' + sectionId,
      variantColorLabel: '#VariantColorLabel-' + sectionId,

      formContainer: '#AddToCartForm-' + sectionId,
    };

    if (!$('#' + this.selectors.productJson).html()) {
      return;
    }

    this.productObject = JSON.parse(document.getElementById(this.selectors.productJson).innerHTML);

    this.$mainSlider = $(this.selectors.mainSlider);
    this.$thumbSlider = $(this.selectors.thumbSlider);
    this.$firstProductImage = this.$mainSlider.find('img').first();

    if (!this.$firstProductImage.length) {
      this.settings.hasImages = false;
    }

    this.init();
  }

  Product.prototype = $.extend({}, Product.prototype, {
    init: function() {
      if (this.inModal) {
        this.$container.addClass(this.classes.isModal);
        $('body').on('modalOpen.QuickShopModal-' + this.sectionId, this.openModalProduct.bind(this));
        $('body').on('modalClose.QuickShopModal-' + this.sectionId, this.closeModalProduct.bind(this));
      }

      this.stringOverrides();
      this.setImageSizes();
      this.initQtySelector();
      this.initAjaxProductForm();
      this.initVariants();
      this.initImageSwitch();

      if (!this.inModal) {
        this.checkIfVideos();
        this.createImageCarousels();
      }
    },

    stringOverrides: function() {
      theme.productStrings = theme.productStrings || {};
      $.extend(theme.strings, theme.productStrings);
    },

    setImageSizes: function() {
      if (!this.settings.hasImages) {
        return;
      }

      // Get srcset image src, works on most modern browsers
      // otherwise defaults to settings.imageSize
      var currentImage = this.$firstProductImage[0].currentSrc;

      if (currentImage) {
        this.settings.imageSize = theme.Images.imageSize(currentImage);
      }

      if (this.settings.zoom) {
        this.settings.imageZoomSize = theme.Images.imageSize(this.$firstProductImage.parent().data('zoom-size'));
      }
    },

    initVariants: function() {
      var options = {
        $container: this.$container,
        enableHistoryState: this.settings.enableHistoryState,
        singleOptionSelector: this.selectors.singleOptionSelector,
        originalSelectorId: this.selectors.originalSelectorId,
        product: this.productObject
      };

      if ($(this.selectors.variantColorLabel).length) {
        this.settings.hasColorSwatches = true;
        this.$colorSwatchLabel = $(this.selectors.variantColorLabel);
        this.colorOptionIndex = this.$colorSwatchLabel.data('option-index');
        this.$container.on('variantChange' + this.settings.namespace, this.updateColorName.bind(this));
      }

      this.variants = new slate.Variants(options);
      this.$container.on('variantChange' + this.settings.namespace, this.updateCartButton.bind(this));
      this.$container.on('variantImageChange' + this.settings.namespace, this.updateVariantImage.bind(this));
      this.$container.on('variantPriceChange' + this.settings.namespace, this.updatePrice.bind(this));
      if ($(this.selectors.sku).length) {
        this.$container.on('variantSKUChange' + this.settings.namespace, this.updateSku.bind(this));
      }
    },

    // Variant change functions
    updateColorName: function(evt) {
      var variant = evt.variant;
      // Temp fix to prevent JS error. Still need to update color label if variant does not exist
      if (variant && variant.options) {
        var colorName = variant.options[this.colorOptionIndex];
        this.$colorSwatchLabel.text(colorName);
      } else {
        this.$colorSwatchLabel.empty();
      }
    },

    updateCartButton: function(evt) {
      var variant = evt.variant;

      if (variant) {
        if (variant.available) {
          // Available, enable the submit button and change text
          $(this.selectors.addToCart).removeClass(this.classes.disabled).prop('disabled', false);
          $(this.selectors.addToCartText).html(theme.strings.addToCart);
        } else {
          // Sold out, disable the submit button and change text
          $(this.selectors.addToCart).addClass(this.classes.disabled).prop('disabled', true);
          $(this.selectors.addToCartText).html(theme.strings.soldOut);
        }
      } else {
        // The variant doesn't exist, disable submit button
        $(this.selectors.addToCart).addClass(this.classes.disabled).prop('disabled', true);
        $(this.selectors.addToCartText).html(theme.strings.unavailable);
      }
    },

    updatePrice: function(evt) {
      var variant = evt.variant;

      if (variant) {
        // Regular price
        $(this.selectors.price).html(theme.Currency.formatMoney(variant.price, theme.settings.moneyFormat)).show();

        // Sale price, if necessary
        if (variant.compare_at_price > variant.price) {
          $(this.selectors.comparePrice).html(theme.Currency.formatMoney(variant.compare_at_price, theme.settings.moneyFormat));
          $(this.selectors.priceWrapper).show();
          $(this.selectors.price).addClass(this.classes.onSale);
          $(this.selectors.comparePriceA11y).attr('aria-hidden', 'false');
          $(this.selectors.priceA11y).attr('aria-hidden', 'false');
        } else {
          $(this.selectors.priceWrapper).hide();
          $(this.selectors.price).removeClass(this.classes.onSale);
          $(this.selectors.comparePriceA11y).attr('aria-hidden', 'true');
        }

        if ($('body').hasClass('currencies-enabled')) {
          theme.currencySwitcher.ajaxrefresh();
        }
      }
    },

    updateSku: function(evt) {
      var variant = evt.variant;
      var newSku = '';

      if (variant) {
        if (variant.sku) {
          newSku = variant.sku;
        }

        $(this.selectors.sku).html(newSku);
      }
    },

    updateVariantImage: function(evt) {
      var variant = evt.variant;
      var sizedImgUrl = theme.Images.getSizedImageUrl(variant.featured_image.src, this.settings.imageSize);
      var zoomSizedImgUrl;

      if (this.settings.zoom) {
        zoomSizedImgUrl = theme.Images.getSizedImageUrl(variant.featured_image.src, this.settings.imageZoomSize);
      }

      var $newImage = $('.product__thumb[data-id="' + variant.featured_image.id + '"]');
      var imageIndex = this._slideIndex($newImage.closest('.product__thumb-item'));

      // If there is no index, slider is not initalized
      if (typeof imageIndex === 'undefined') {
        return;
      }

      // console.log('slick go to : ' + imageIndex);
      this.$mainSlider.slick('slickGoTo', imageIndex);
    },

    // Image/thumbnail toggling
    initImageSwitch: function() {
      if (!$(this.selectors.photoThumbs).length) {
        return;
      }

      var self = this;

      $(this.selectors.photoThumbs).on('click', function(evt) {
        evt.preventDefault();
      });
    },

    checkIfVideos: function() {
      var $productVideos = this.$mainSlider.find(this.selectors.productVideo);

      // Stop if there are 0 videos
      if (!$productVideos.length) {
        return false;
      }

      var videoTypes = [];

      $productVideos.each(function() {
        var type = $(this).data('video-type');

        if (videoTypes.indexOf(type) < 0) {
          videoTypes.push(type);
        }
      });

      // Load YouTube API if not already loaded
      if (videoTypes.indexOf('youtube') > -1) {
        if (!theme.config.youTubeReady) {
          window.loadYouTube();
          $('body').on('youTubeReady' + this.settings.namespace, function() {
            this.loadYoutubeVideos($productVideos);
          }.bind(this));
        } else {
          this.loadYoutubeVideos($productVideos);
        }
      }

      // Load Vimeo API if not already loaded
      if (videoTypes.indexOf('vimeo') > -1) {
        if (!vimeoReady) {
          window.loadVimeo();
          $('body').on('vimeoReady' + this.settings.namespace, function() {
            this.loadVimeoVideos($productVideos);
          }.bind(this))
        } else {
          this.loadVimeoVideos($productVideos);
        }
      }

      // Add mp4 video players
      if (videoTypes.indexOf('mp4') > -1) {
        this.loadMp4Videos($productVideos);
      }

      return videoTypes;
    },

    loadMp4Videos: function($videos) {
      $videos.each(function() {
        var $el = $(this);
        if ($el.data('video-type') != 'mp4') {
          return;
        }

        var id = $el.attr('id');
        var videoId = $el.data('video-id');

        videos[this.id] = {
          type: 'mp4',
          divId: id,
          style: $el.data('video-style')
        };
      });
    },

    loadVimeoVideos: function($videos) {
      $videos.each(function() {
        var $el = $(this);
        if ($el.data('video-type') != 'vimeo') {
          return;
        }

        var id = $el.attr('id');
        var videoId = $el.data('video-id');

        videos[this.id] = {
          type: 'vimeo',
          divId: id,
          id: videoId,
          style: $el.data('video-style'),
          width: $el.data('video-width'),
          height: $el.data('video-height')
        };
      });

      // Create a new player for each Vimeo video
      for (var key in videos) {
        if (videos[key].type != 'vimeo') {
          continue;
        }

        var args = $.extend({}, vimeoVideoOptions, videos[key]);
        vimeoPlayers[key] = new Vimeo.Player(videos[key].divId, args);
      }

      vimeoReady = true;
    },

    autoplayVimeoVideo: function(id) {
      // Do not autoplay on mobile though
      if (!theme.config.bpSmall) {
        this.requestToPlayVimeoVideo(id);
      } else {
        // Set as loaded on mobile so you can see the image
        var $player = $('#' + id);
        setParentAsLoaded($player);
      }
    },

    requestToPlayVimeoVideo: function(id) {
      // The slider may initialize and attempt to play the video before
      // the API is even ready, because it sucks.

      var $player = $('#' + id);
      setParentAsLoading($player);

      if (!vimeoReady) {
        // Wait for the trigger, then play it
        $('body').on('vimeoReady' + this.settings.namespace, function() {
          this.playVimeoVideo(id);
        }.bind(this))
        return;
      }

      this.playVimeoVideo(id);
    },

    playVimeoVideo: function(id) {
      vimeoPlayers[id].play();

      if (videos[id].style === 'muted') {
        vimeoPlayers[id].setVolume(0);
      }

      var $player = $('#' + id);
      setParentAsLoaded($player);
    },

    stopVimeoVideo: function(id) {
      if (!theme.config.vimeoReady) {
        return;
      }

      if (id) {
        vimeoPlayers[id].pause();
      } else {
        for (key in vimeoPlayers) {
          if (typeof vimeoPlayers[key].pause === 'function') {
            vimeoPlayers[key].pause();
          }
        }
      }
    },

    loadYoutubeVideos: function($videos) {
      $videos.each(function() {
        var $el = $(this);
        if ($el.data('video-type') != 'youtube') {
          return;
        }

        var id = $el.attr('id');
        var videoId = $el.data('youtube-id');

        videos[this.id] = {
          type: 'youtube',
          id: id,
          videoId: videoId,
          style: $el.data('video-style'),
          width: $el.data('video-width'),
          height: $el.data('video-height')
        };
      });

      // Create a player for each YouTube video
      for (var key in videos) {
        if (videos[key].type === 'youtube') {
          if (videos.hasOwnProperty(key)) {
            var args = $.extend({}, youtubeVideoOptions, videos[key]);

            if (args.style === 'muted') {
              // default youtubeVideoOptions, no need to change anything
            } else {
              args.playerVars.controls = 1;
              args.playerVars.autoplay = 0;
            }

            youtubePlayers[key] = new YT.Player(key, args);
          }
        }
      }

      youtubeReady = true;
    },

    requestToPlayYoutubeVideo: function(id, forcePlay) {
      if (!theme.config.youTubeReady) {
        return;
      }

      var $player = $('#' + id);
      setParentAsLoading($player);

      // If video is requested too soon, player might not be ready.
      // Set arbitrary timeout to request it again in a second
      if (typeof youtubePlayers[id].playVideo != 'function') {
        var o = this;
        setTimeout(function() {
          o.playYoutubeVideo(id, forcePlay);
        }, 1000);
        return;
      }

      this.playYoutubeVideo(id, forcePlay);
    },

    playYoutubeVideo: function (id, forcePlay) {
      var $player = $('#' + id);
      setParentAsLoaded($player);
      youtubePlayers[id].playVideo();

      // forcePlay is sent as true from beforeSlideChange so the visibility
      // check isn't fooled by the next slide positioning
      if (!forcePlay) {
        initCheckVisibility(id);
      }
    },

    stopYoutubeVideo: function(id) {
      if (!theme.config.youTubeReady) {
        return;
      }

      if (id && youtubePlayers[id]) {
        youtubePlayers[id].pauseVideo();
        $(window).off('scroll.' + id);
      } else {
        for (key in youtubePlayers) {
          if (typeof youtubePlayers[key].pauseVideo === 'function') {
            youtubePlayers[key].pauseVideo();
            $(window).off('scroll.' + key);
          }
        }
      }
    },

    playMp4Video: function(id) {
      var $player = $('#' + id);
      setParentAsLoaded($player);

      $player[0].play();
    },

    stopMp4Video: function(id) {
      if (id) {
        $('#' + id)[0].pause();
      } else {
        // loop through all mp4 videos to stop them
        for (var key in videos) {
          if (videos[key].type === 'mp4') {
            var player = $('#' + videos[key].divId)[0];
            if (typeof player.pause === 'function') {
              player.pause();
            }
          }
        }
      }
    },

    // Init zoom for each image in the main carousel
    initZoom: function($image) {
      var largeImage = $image.parent().data('zoom-size');
      $image.parent()
      .on('click', function(evt) {
        evt.preventDefault();
      })
      .zoom({
        on: 'click',
        url: largeImage,
        duration: 180,
        touch: false,
        onZoomIn: function() {
          $(this).addClass('photo-zoom-linked');
        },
        onZoomOut: function() {
          $(this).removeClass('photo-zoom-linked');
        }
      });
    },

    createImageCarousels: function() {
      // Init zoom on non-lazy loaded image
      if (this.settings.zoom) {
        this.initZoom($('.photo-zoom-link__initial'));
      }

      if (!this.$thumbSlider.length || $(this.selectors.photoThumbs).length < 2) {
        // Single product image. Init video if it exists
        var $video = $('.product-image-main').find('.product__video');
        if ($video.length) {
          this.initVideo($video);
        }
        return;
      }

      this.settings.hasMultipleImages = true;

      // Set starting slide (for both sliders)
      var $activeSlide = this.$mainSlider.find('.starting-slide');
      var startIndex = this._slideIndex($activeSlide);

      // Lame way to prevent duplicate event listeners
      this.$mainSlider.off('init');
      this.$mainSlider.off('beforeChange');
      this.$mainSlider.on('init', this.mainSlideInit.bind(this));
      this.$mainSlider.on('beforeChange', this.beforeSlideChange.bind(this));

      this.$mainSlider.slick({
        asNavFor: this.selectors.thumbSlider,
        infinite: false,
        arrows: false,
        dots: false,
        initialSlide: startIndex
      });

      this.$thumbSlider.slick({
        asNavFor: this.selectors.mainSlider,
        slidesToShow: 3,
        slidesToScroll: 1,
        arrows: false,
        dots: false,
        vertical: true,
        verticalSwiping: true,
        focusOnSelect: true,
        infinite: false,
        customHeightMatching: true,
        customSlideAdvancement: true,
        initialSlide: startIndex
      });

      this.settings.slickInitialized = true;
    },

    destroyImageCarousels: function() {
      if (!this.settings.slickInitialized) {
        return;
      }

      if (this.$mainSlider) {
        this.$mainSlider.slick('unslick');
      }

      if (this.$thumbSlider) {
        this.$thumbSlider.slick('unslick');
      }

      this.settings.slickInitialized = false;
    },

    mainSlideInit: function(event, slick) {
      var $slider = slick.$slider;
      var $currentSlide = $slider.find('.' + classes.currentSlide);
      var $video = $currentSlide.find('.' + classes.productVideo);

      if (!$video.length) {
        return;
      }

      this.initVideo($video);
    },

    initVideo: function($video) {
      var videoType = $video.data('video-type');
      var divId = $video.attr('id');

      if (videoType === 'mp4' && videos[divId].style === 'muted') {
        this.playMp4Video(divId);
      }

      if (videoType === 'youtube') {
        if (youtubeReady && videos[divId].style === 'muted') {
          this.requestToPlayYoutubeVideo(divId);
        }
      }

      if (videoType === 'vimeo') {
        if (vimeoReady && videos[divId].styles === 'muted') {
          // Because the vimeo API might not be ready, this autoplay check
          // is handled elsewhere
          this.autoplayVimeoVideo(divId);
        }
      }

      // Hacky way to trigger resetting the slider layout in modals
      if (this.inModal) {
        this.resizeSlides();
      }
    },

    getVideoType: function($video) {
      return $video.data('video-type');
    },

    getVideoId: function($video) {
      return $video.attr('id');
    },

    beforeSlideChange: function(event, slick, currentSlide, nextSlide) {
      var $slider = slick.$slider;
      var $currentSlide = $slider.find('.' + classes.currentSlide);
      var $prevVideo = $currentSlide.find('.product__video');
      var $nextSlide = $slider.find('.slick-slide[data-slick-index="' + nextSlide + '"]');
      var $nextVideo = $nextSlide.find('.product__video');

      // Pause any existing slide video
      if (currentSlide !== nextSlide && $prevVideo.length) {
        var prevVideoType = this.getVideoType($prevVideo);
        var prevVideoId = this.getVideoId($prevVideo);

        if (prevVideoId) {
          if (prevVideoType === 'youtube') {
            this.stopYoutubeVideo(prevVideoId);
          }

          if (prevVideoType === 'mp4') {
            this.stopMp4Video(prevVideoId);
          }

          if (prevVideoType === 'vimeo') {
            this.stopVimeoVideo(prevVideoId);
          }
        }
      }

      // Prep next slide video
      if ($nextVideo.length) {
        var nextVideoType = this.getVideoType($nextVideo);
        var nextVideoId = this.getVideoId($nextVideo);

        // Prep Vimeo with a backup in case the API isn't ready
        if (nextVideoId && nextVideoType === 'vimeo') {
          if (vimeoReady) {
            if (videos[nextVideoId] && videos[nextVideoId].style === 'muted') {
              this.autoplayVimeoVideo(nextVideoId);
            }
          } else {
            $('body').on('vimeoReady' + this.settings.namespace, function() {
              if (videos[nextVideoId] && videos[nextVideoId].style === 'muted') {
                this.autoplayVimeoVideo(nextVideoId);
              }
            }.bind(this))
          }
        }

        // Prep YouTube with a backup in case API isn't ready
        if (nextVideoId && nextVideoType === 'youtube') {
          if (youtubeReady) {
            if (videos[nextVideoId] && videos[nextVideoId].style === 'muted') {
              this.requestToPlayYoutubeVideo(nextVideoId, true);
            }
          } else {
            $('body').on('youTubeReady' + this.settings.namespace, function() {
              if (videos[nextVideoId] && videos[nextVideoId].style === 'muted') {
                this.requestToPlayYoutubeVideo(nextVideoId, true);
              }
            }.bind(this))
          }
        }

        // Autoplay muted MP4 videos
        if (nextVideoId && videos[nextVideoId] && videos[nextVideoId].style === 'muted') {
          if (nextVideoType === 'mp4') {
            this.playMp4Video(nextVideoId);
          }
        }

        // Set unmuted videos to loaded state
        if (nextVideoId && videos[nextVideoId] && videos[nextVideoId].style != 'muted') {
          setParentAsLoaded($('#' + nextVideoId));
        }
      }

      // Layload zoom image
      if (this.settings.zoom) {
        if ($nextSlide.hasClass(classes.zoomInit)) {
          return;
        }
        var $image = $nextSlide.addClass(classes.zoomInit).find('img').addClass('lazyload');
        this.initZoom($image);
      }
    },

    resizeSlides: function() {
      if (!this.settings.hasMultipleImages) {
        return;
      }

      $(window).trigger('resize');
      setTimeout(function() {
        this.$mainSlider.slick('setPosition');
        this.$thumbSlider.slick('setPosition');
      }.bind(this), 500); // same timing as modal open transition
    },

    _slideIndex: function($el) {
      return $el.data('index');
    },

    // Ajax cart and qty
    initQtySelector: function() {
      this.$container.find('.js-qty').each(function() {
        new theme.QtySelector($(this), {
          namespace: '.product'
        });
      });
    },

    initAjaxProductForm: function() {
      if (theme.settings.cartType === 'drawer') {
        new theme.AjaxProduct($(this.selectors.formContainer));
      }
    },

    openModalProduct: function() {
      if (!this.settings.modalInit) {
        this.loadModalContent();
        this.createImageCarousels();
        this.settings.modalInit = true;
      }

      this.resizeSlides();
    },

    closeModalProduct: function() {
      this.stopYoutubeVideo();
      this.stopVimeoVideo();
      this.stopMp4Video();
    },

    loadModalContent: function() {
      if (this.settings.modalContentLoaded) {
        return;
      }

      // Load images
      var imageCount = $(this.selectors.photoThumbs).length * 2; // thumbs and main images
      var loadCount = 0;

      this.$modal.find('img[data-modal-lazy]').each(function(i, img) {
        var $el = $(img);
        var image = $el.data('modal-lazy');
        $el.attr('src', image);
        loadCount++;

        if (loadCount == imageCount) {
          this.settings.modalContentLoaded = true;
        }
      }.bind(this));

      // Load videos if they exist
      var videoTypes = this.checkIfVideos();

      // Lazyload mp4 videos similar to images
      if (videoTypes && videoTypes.indexOf('mp4') > -1) {
        this.$modal.find('.product__video[data-video-type="mp4"]').each(function(i, video) {
          var $el = $(video);
          var src = $el.data('video-src');
          var source = document.createElement('source');
          source.setAttribute('src', src);
          $el.append(source);
        }.bind(this));
      }
    },

    onUnload: function() {
      this.$container.off(this.settings.namespace);
      $('body').off(this.settings.namespace);
      this.destroyImageCarousels();
    }
  });

  return Product;
})();


theme.Collection = (function() {
  var classes = {
    tags: '.tags',
    activeTag: 'tag--active'
  };

  function Collection(container) {
    this.container = container;
    this.namespace = '.collection-' + this.sectionId;

    theme.preloadImages(container);

    // Ajax pagination
    $(window).on('popstate', function(state) {
      if (state) {
        this.getNewCollectionContent(location.href);
      }
    }.bind(this));

    this.init();
  }

  Collection.prototype = $.extend({}, Collection.prototype, {
    init: function() {
      // init is called on load and when tags are selected
      this.$container = $(this.container);
      this.sectionId = this.$container.attr('data-section-id');

      this.sortBy();
      this.sortTags();
      this.initTagAjax();
    },

    initTagAjax: function() {
      this.$container.on('click' + this.namespace, '.tags a', function(evt) {
        evt.preventDefault();
        var $el = $(evt.currentTarget);
        var newUrl = $el.attr('href');
        $(classes.tags).find('.' + classes.activeTag).removeClass(classes.activeTag);
        $el.parent().addClass(classes.activeTag);
        history.pushState({}, '', newUrl);
        $('.grid-product').addClass('unload');
        this.getNewCollectionContent(newUrl);
      }.bind(this));
    },

    getNewCollectionContent: function(url) {
      $('#CollectionAjaxResult').load(url + ' #CollectionAjaxContent', function() {
        this.reInit();
      }.bind(this));
    },

    sortBy: function() {
      var $sortBy = $('#SortBy');

      if (!$sortBy.length) {
        return;
      }

      $sortBy.on('change', function() {
        location.href = '?sort_by=' + $(this).val();
      });
    },

    sortTags: function() {
      var $sortTags = $('#SortTags');

      if (!$sortTags.length) {
        return;
      }

      $sortTags.on('change', function() {
        location.href = $(this).val();
      });
    },

    reInit: function() {
      // Reload collection template (it can be anywhere in the sections.instance array)
      for (var i = 0; i < sections.instances.length; i++) {
        var instance = sections.instances[i];
        if (instance['type'] === 'collection-template') {
          instance.forceReload();
        }
      }

      // Reload quick shop buttons
      theme.initQuickShop();

      // Reload products inside each quick shop
      sections.register('product-template', theme.Product);
    },

    forceReload: function() {
      this.onUnload();
      this.init();
    },

    onUnload: function() {
      $(window).off(this.namespace);
      this.$container.off(this.namespace);
    }

  });

  return Collection;
})();

theme.HeaderSection = (function() {

  var selectors = {
    drawer: '#NavDrawer',
    mobileSubNavToggle: '.mobile-nav__toggle-btn',
    hasSublist: '.mobile-nav__has-sublist'
  };

  var classes = {
    navExpanded: 'mobile-nav--expanded'
  };

  function Header(container) {
    var $container = this.$container = $(container);
    var sectionId = this.sectionId = $container.attr('data-section-id');

    // Reload any slideshow if when the header is reloaded to make sure the
    // sticky header works as expected (it can be anywhere in the sections.instance array)
    for (var i = 0; i < sections.instances.length; i++) {
      var instance = sections.instances[i];
      if (instance['type'] === 'slideshow-section') {
        instance.forceReload();
      }
    }

    theme.currencySwitcher.init()
    this.initDrawers();
    theme.headerNav.init();
    theme.announcementBar.init();
  }

  Header.prototype = $.extend({}, Header.prototype, {
    initDrawers: function() {
      theme.NavDrawer = new theme.Drawers('NavDrawer', 'nav');
      if (theme.settings.cartType === 'drawer') {
        new theme.CartDrawer();
      }

      this.drawerMenuButtons();
    },

    drawerMenuButtons: function() {
      $(selectors.drawer).find('.js-drawer-close').on('click', function(evt){
        evt.preventDefault();
        theme.NavDrawer.close();
      });

      var $mobileSubNavToggle = $(selectors.mobileSubNavToggle);

      $mobileSubNavToggle.attr('aria-expanded', 'false');
      $mobileSubNavToggle.each(function (i, el) {
        var $el = $(el);
        $el.attr('aria-controls', $el.attr('data-aria-controls'));
      });

      $mobileSubNavToggle.on('click', function() {
        var $el = $(this);
        var currentlyExpanded = $el.attr('aria-expanded');
        var toggleState = false;

        // Updated aria-expanded value based on state pre-click
        if (currentlyExpanded === 'true') {
          $el.attr('aria-expanded', 'false');
        } else {
          $el.attr('aria-expanded', 'true');
          toggleState = true;
        }

        // Toggle class that expands/collapses sublist
        $el.closest(selectors.hasSublist).toggleClass(classes.navExpanded, toggleState);
      });
    },

    onUnload: function() {
      theme.NavDrawer.close();
      theme.headerNav.unload();
    }
  });

  return Header;

})();

theme.FeaturedContentSection = (function() {

  function FeaturedContent() {
    $('.rte').find('a:not(:has(img))').addClass('text-link');
  }

  return FeaturedContent;
})();

theme.slideshows = {};

theme.SlideshowSection = (function() {

  function SlideshowSection(container) {
    var $container = this.$container = $(container);
    var $section = $container.parent();
    var sectionId = $container.attr('data-section-id');
    var slideshow = this.slideshow = '#Slideshow-' + sectionId;

    theme.preloadImages(container);

    this.init();
  }

  SlideshowSection.prototype = $.extend({}, SlideshowSection.prototype, {
    init: function() {
      theme.slideshows[this.slideshow] = new theme.Slideshow(this.slideshow, null);
    },

    forceReload: function() {
      this.onUnload();
      this.init();
    },

    onUnload: function() {
      theme.slideshows[this.slideshow].destroy();
      delete theme.slideshows[this.slideshow];
    },

    onSelect: function() {
      $(this.slideshow).slick('slickPause');
    },

    onDeselect: function() {
      $(this.slideshow).slick('slickPlay');
    },

    onBlockSelect: function(evt) {
      var $slideshow = $(this.slideshow);

      // Ignore the cloned version
      var $slide = $('.slideshow__slide--' + evt.detail.blockId + ':not(.slick-cloned)');
      var slideIndex = $slide.data('slick-index');

      // Go to selected slide, pause autoplay
      $slideshow.slick('slickGoTo', slideIndex).slick('slickPause');
    },

    onBlockDeselect: function() {
      $(this.slideshow).slick('slickPlay');
    }
  });

  return SlideshowSection;
})();

theme.VideoSection = (function() {
  var youtubeReady;
  var videos = [];
  var youtubePlayers = [];
  var youtubeVideoOptions = {
    width: 1280,
    height: 720,
    playerVars: {
      autohide: 0,
      branding: 0,
      cc_load_policy: 0,
      controls: 0,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      quality: 'hd720',
      rel: 0,
      showinfo: 0,
      wmode: 'opaque'
    },
    events: {
      onReady: onVideoPlayerReady,
      onStateChange: onVideoStateChange
    }
  };

  var vimeoReady = false;
  var vimeoVideoOptions = {
    byline: false,
    title: false,
    portrait: false,
    loop: true
  };

  var selectors = {
    videoParent: '.video-parent-section'
  };

  var classes = {
    loading: 'loading',
    preloaded: 'preloaded',
    interactable: 'video-interactable'
  };

  function videoSection(container) {
    if (theme.config.isIframe) {
      return;
    }
    var $container = this.$container = $(container);
    var sectionId = this.sectionId = $container.attr('data-section-id');
    var youtubePlayerId = this.youtubePlayerId = 'YouTubeVideo-' + this.sectionId;
    this.namespace = '.' + youtubePlayerId;
    var vimeoPlayerId = this.vimeoPlayerId = 'Vimeo-' + this.sectionId;
    var $vimeoTrigger = this.$vimeoTrigger = $('#VimeoTrigger-' + this.sectionId);
    var mp4Video = 'Mp4Video-' + this.sectionId;

    var $youtubeDiv = $('#' + youtubePlayerId);
    var $vimeoDiv = $('#' + vimeoPlayerId);
    var $mp4Div = $('#' + mp4Video);

    this.vimeoPlayer = [];

    if ($youtubeDiv.length) {
      this.youtubeVideoId = $youtubeDiv.data('video-id');
      this.initYoutubeVideo();
    }

    if ($vimeoDiv.length) {
      this.vimeoVideoId = $vimeoDiv.data('video-id');
      this.initVimeoVideo();
    }

    if ($mp4Div.length) {
      setParentAsLoaded($mp4Div);

      startMp4Playback(mp4Video).then(function() {
        // Video played as expected, don't do anything
      }).catch(function(error) {
        // Video cannot be played with autoplay, so let
        // user interact with video element itself
        setVideoToBeInteractedWith($mp4Div);
      })
    }
  }

  function startMp4Playback(mp4Video) {
    return document.querySelector('#' + mp4Video).play();
  }

  function onVideoPlayerReady(evt) {
    var $player = $(evt.target.a);
    var playerId = $player.attr('id');
    youtubePlayers[playerId] = evt.target; // update stored player
    var player = youtubePlayers[playerId];

    setParentAsLoading($player);

    youtubePlayers[playerId].mute();

    // Remove from tabindex because YouTube iframes are annoying and you can focus
    // on the YouTube logo and it breaks
    $player.attr('tabindex', '-1');

    // Add out of view pausing
    videoVisibilityCheck(playerId);
    $(window).on('scroll.' + playerId, {id: playerId}, $.throttle(150, videoVisibilityCheck));
  }

  function videoVisibilityCheck(id) {
    var playerId;

    if (typeof id === 'string') {
      playerId = id;
    } else {
      // Data comes in as part of the scroll event
      playerId = id.data.id;
    }

    if (theme.isElementVisible($('#' + playerId))) {
      playVisibleVideo(playerId);
    } else {
      pauseHiddenVideo(playerId);
    }
  }

  function playVisibleVideo(id) {
    if (typeof youtubePlayers[id].playVideo === 'function') {
      youtubePlayers[id].playVideo();
    }
  }

  function pauseHiddenVideo(id) {
    if (typeof youtubePlayers[id].pauseVideo === 'function') {
      youtubePlayers[id].pauseVideo();
    }
  }

  function onVideoStateChange(evt) {
    var $player = $(evt.target.a);
    var playerId = $player.attr('id');
    var player = youtubePlayers[playerId];

    switch (evt.data) {
      case -1: // unstarted
        // Handle low power state on iOS by checking if
        // video is reset to unplayed after attempting to buffer
        if (videos[playerId].attemptedToPlay) {
          setParentAsLoaded($player);
          setVideoToBeInteractedWith($player);
        }
        break;
      case 0: // ended
        player.playVideo();
        break;
      case 1: // playing
        setParentAsLoaded($player);
        break;
      case 3: // buffering
        videos[playerId].attemptedToPlay = true;
        break;
    }
  }

  function setParentAsLoading($el) {
    $el
      .closest(selectors.videoParent)
      .addClass(classes.loading);
  }

  function setParentAsLoaded($el) {
    $el
      .closest(selectors.videoParent)
      .removeClass(classes.loading)
      .addClass(classes.preloaded);
  }

  function setVideoToBeInteractedWith($el) {
    $el
      .closest(selectors.videoParent)
      .addClass(classes.interactable);
  }

  videoSection.prototype = $.extend({}, videoSection.prototype, {
    initYoutubeVideo: function() {
      videos[this.youtubePlayerId] = {
        id: this.youtubePlayerId,
        videoId: this.youtubeVideoId,
        type: 'youtube',
        attemptedToPlay: false
      };

      if (!youtubeReady) {
        window.loadYouTube();
        $('body').on('youTubeReady' + this.namespace, this.loadYoutubeVideo.bind(this));
      } else {
        this.loadYoutubeVideo();
      }
    },

    loadYoutubeVideo: function() {
      var args = $.extend({}, youtubeVideoOptions, videos[this.youtubePlayerId]);
      args.playerVars.controls = 0;
      youtubePlayers[this.youtubePlayerId] = new YT.Player(this.youtubePlayerId, args);

      youtubeReady = true;
    },

    initVimeoVideo: function() {
      videos[this.vimeoPlayerId] = {
        divId: this.vimeoPlayerId,
        id: this.vimeoVideoId,
        type: 'vimeo'
      };

      var $player = $('#' + this.vimeoPlayerId);
      setParentAsLoading($player);

      // Button to play video on mobile
      this.$vimeoTrigger.on('click', + this.namespace, function(evt) {
        // $(evt.currentTarget).addClass('hide');
        this.requestToPlayVimeoVideo(this.vimeoPlayerId);
      }.bind(this));

      if (!vimeoReady) {
        window.loadVimeo();
        $('body').on('vimeoReady' + this.namespace, this.loadVimeoVideo.bind(this));
      } else {
        this.loadVimeoVideo();
      }
    },

    loadVimeoVideo: function() {
      var args = $.extend({}, vimeoVideoOptions, videos[this.vimeoPlayerId]);
      this.vimeoPlayer[this.vimeoPlayerId] = new Vimeo.Player(videos[this.vimeoPlayerId].divId, args);

      vimeoReady = true;

      // Only autoplay on larger screens
      if (!theme.config.bpSmall) {
        this.requestToPlayVimeoVideo(this.vimeoPlayerId);
      } else {
        var $player = $('#' + this.vimeoPlayerId);
        setParentAsLoaded($player);
      }
    },

    requestToPlayVimeoVideo: function(id) {
      // The slider may initialize and attempt to play the video before
      // the API is even ready, because it sucks.

      if (!vimeoReady) {
        // Wait for the trigger, then play it
        $('body').on('vimeoReady' + this.namespace, function() {
          this.playVimeoVideo(id);
        }.bind(this))
        return;
      }

      this.playVimeoVideo(id);
    },

    playVimeoVideo: function(id) {
      this.vimeoPlayer[id].play();
      this.vimeoPlayer[id].setVolume(0);

      var $player = $('#' + id);
      setParentAsLoaded($player);
    },

    onUnload: function(evt) {
      var sectionId = evt.target.id.replace('shopify-section-', '');
      var playerId = 'YouTubeVideo-' + sectionId;
      youtubePlayers[playerId].destroy();
      $(window).off('scroll' + this.namespace);
      $('body').off('vimeoReady' + this.namespace);
    }
  });

  return videoSection;
})();

theme.Testimonials = (function() {
  var slideCount = 0;
  var defaults = {
    accessibility: true,
    arrows: false,
    dots: true,
    autoplay: false,
    touchThreshold: 20,
    slidesToShow: 3,
    slidesToScroll: 3
  };

  function Testimonials(container) {
    var $container = this.$container = $(container);
    var sectionId = $container.attr('data-section-id');
    var wrapper = this.wrapper = '.testimonials-wrapper';
    var slider = this.slider = '#Testimonials-' + sectionId;
    var $slider = $(slider);

    this.sliderActive = false;
    var mobileOptions = $.extend({}, defaults, {
      slidesToShow: 1,
      slidesToScroll: 1,
      adaptiveHeight: true
    });

    slideCount = $slider.data('count');

    // Override slidesToShow/Scroll if there are not enough blocks
    if (slideCount < defaults.slidesToShow) {
      defaults.slidesToShow = slideCount;
      defaults.slidesToScroll = slideCount;
    }

    $slider.on('init', this.a11y.bind(this));

    if (theme.config.bpSmall) {
      this.init($slider, mobileOptions);
    } else {
      this.init($slider, defaults);
    }

    $('body').on('matchSmall', function() {
      this.init($slider, mobileOptions);
    }.bind(this));

    $('body').on('matchLarge', function() {
      this.init($slider, defaults);
    }.bind(this));
  }

  Testimonials.prototype = $.extend({}, Testimonials.prototype, {
    onUnload: function() {
      $(this.slider, this.wrapper).slick('unslick');
    },

    onBlockSelect: function(evt) {
      // Ignore the cloned version
      var $slide = $('.testimonials-slide--' + evt.detail.blockId + ':not(.slick-cloned)');
      var slideIndex = $slide.data('slick-index');

      // Go to selected slide, pause autoplay
      $(this.slider, this.wrapper).slick('slickGoTo', slideIndex);
    },

    init: function(obj, args) {
      if (this.sliderActive) {
        obj.slick('unslick');
        this.sliderActive = false;
      }

      obj.slick(args);
      this.sliderActive = true;
    },

    a11y: function(event, obj) {
      var $list = obj.$list;
      var $wrapper = $(this.wrapper, this.$container);

      // Remove default Slick aria-live attr until slider is focused
      $list.removeAttr('aria-live');

      // When an element in the slider is focused set aria-live
      $wrapper.on('focusin', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.attr('aria-live', 'polite');
        }
      });

      // Remove aria-live
      $wrapper.on('focusout', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.removeAttr('aria-live');
        }
      });
    }
  });

  return Testimonials;
})();

theme.Instagram = (function() {
  var defaults = {

  };

  function Instagram(container) {
    var $container = this.$container = $(container);
    var sectionId = $container.attr('data-section-id');
    var $target = $('#Instafeed-' + sectionId);

    if (!$target.length) {
      return;
    }

    var userId = $target.data('user-id');
    var clientId = $target.data('client-id');
    var count = $target.data('count');

    var feed = this.feed = new Instafeed({
      target: $target[0],
      accessToken: clientId,
      get: 'user',
      userId: userId,
      limit: count,
      template: '<div class="grid__item small--one-half medium-up--one-fifth" data-aos="row-of-5"><div class="image-wrap"><a href="{{link}}" target="_blank" style="background-image: url({{image}}); display: block; padding-bottom: 100%; background-size: cover;"></a></div></div>',
      resolution: 'standard_resolution'
    });

    feed.run();
  }

  Instagram.prototype = $.extend({}, Instagram.prototype, {
    onUnload: function() {

    }
  });

  return Instagram;
})();


theme.NewsletterPopup = (function() {
  function NewsletterPopup(container) {
    var $container = this.$container = $(container);
    var sectionId = $container.attr('data-section-id');
    this.cookieName = 'newsletter-' + sectionId;

    if (!$container.length) {
      return;
    }

    this.data = {
      secondsBeforeShow: $container.data('delay-seconds'),
      daysBeforeReappear: $container.data('delay-days'),
      cookie: $.cookie(this.cookieName),
      testMode: $container.data('test-mode')
    };

    this.modal = new theme.Modals('NewsletterPopup-' + sectionId, 'newsletter-popup-modal');

    // Open modal if errors or success message exist
    if ($container.find('.errors').length || $container.find('.note--success').length) {
      this.modal.open();
    }

    // Set cookie as opened if success message
    if ($container.find('.note--success').length) {
      this.closePopup();
      return;
    }

    $('body').on('modalClose.' + $container.attr('id'), this.closePopup.bind(this));

    if (!this.data.cookie || this.data.testMode) {
      this.initPopupDelay();
    }
  }

  NewsletterPopup.prototype = $.extend({}, NewsletterPopup.prototype, {
    initPopupDelay: function() {
      setTimeout(function() {
        this.modal.open();
      }.bind(this), this.data.secondsBeforeShow * 1000);
    },

    closePopup: function() {
      // Remove a cookie in case it was set in test mode
      if (this.data.testMode) {
        $.removeCookie(this.cookieName, { path: '/' });
        return;
      }

      $.cookie(this.cookieName, 'opened', { expires: this.data.daysBeforeReappear });
    },

    onLoad: function() {
      this.modal.open();
    },

    onSelect: function() {
      this.modal.open();
    },

    onDeselect: function() {
      this.modal.close();
    },

    onUnload: function() {}
  });

  return NewsletterPopup;
})();

theme.FadingImages = (function() {

  var classes = {
    activeImage: 'active-image',
    finishedImage: 'finished-image',
    activeTitles: 'active-titles',
    finishedTitles: 'finished-titles',
    compensation: 'compensation'
  };

  function FadingImages(container) {
    var $container = this.$container = $(container);
    var sectionId = $container.attr('data-section-id');
    var namespace = this.namespace = '.fading-images-' + sectionId;

    if (!$container.length) {
      return;
    }

    theme.preloadImages(container);

    this.data = {
      isInit: false,
      interval: $container.data('interval'),
      block_count: $container.data('count'),
      finish_interval: 1000,
      timer_offset: 400,
      active_image: 1,
      active_title: 1,
      removed_compensation: false
    };

    this.selectors = {
      $allTitles: $container.find('.fading-images-overlay__titles')
    };

    this.checkVisibility();
    $(window).on('scroll' + this.namespace, $.throttle(50, this.checkVisibility.bind(this)));
  }

  FadingImages.prototype = $.extend({}, FadingImages.prototype, {
    checkVisibility: function() {
      if (this.data.isInit) {
        $(window).off('scroll' + this.namespace);
        return;
      }

      if (theme.isElementVisible(this.$container) && this.$container.find('.fading-images').hasClass('preloaded')) {
        this.startImages();
        this.startTitles();
        this.data.isInit = true;
      }
    },

    nextImage: function() {
      var $container = this.$container;

      if (!this.data.removed_compensation) {
        $container.find('.fading-images__item[data-slide-index=' + this.data.active_image + ']').removeClass(classes.compensation);
        this.data.removed_compensation = true;
      }

      $container
        .find('.fading-images__item[data-slide-index=' + this.data.active_image + ']')
        .removeClass(classes.activeImage)
        .addClass(classes.finishedImage);

      var target_image = this.data.active_image;
      window.setTimeout(function() {
        $container.find('.fading-images__item[data-slide-index=' + target_image + ']').removeClass(classes.finishedImage);
      }, this.data.finish_interval);

      this.data.active_image++;
      if (this.data.active_image > this.data.block_count) {
        this.data.active_image = 1;
      }

      $container.find('.fading-images__item[data-slide-index=' + this.data.active_image + ']').addClass(classes.activeImage);
    },

    nextTitle: function() {
      var $container = this.$container;
      var $allTitles = this.selectors.$allTitles;

      this.selectors.$allTitles.removeClass(classes.activeTitles).addClass(classes.finishedTitles);

      this.data.active_title++;
      if (this.data.active_title > this.data.block_count) {
        this.data.active_title = 1;
      }

      var target_title = this.data.active_title;
      window.setTimeout(function() {
        var newText1 = $container.find('.fading-images__item[data-slide-index=' + target_title + ']').attr('data-slide-title1');
        var newText2 = $container.find('.fading-images__item[data-slide-index=' + target_title + ']').attr('data-slide-title2');
        $container.find('.fading-images-overlay__title--1').text(newText1);
        $container.find('.fading-images-overlay__title--2').text(newText2);
        $allTitles.removeClass(classes.finishedTitles).addClass(classes.activeTitles);
      }, this.data.finish_interval - 200);
    },

    startImages: function() {
      // Prep and show first image
      this.$container.find('.fading-images__item[data-slide-index=' + this.data.active_image + ']').addClass(classes.activeImage).addClass(classes.compensation);

      // Begin timer
      var o = this;
      window.setTimeout(function() {
        var fading_images_timer = window.setInterval(o.nextImage.bind(o), o.data.interval);
      }, this.data.timer_offset);
    },

    startTitles: function() {
      var $container = this.$container;
      var $allTitles = this.selectors.$allTitles;
      // Prep and show first titles
      var target_title = this.data.active_title;
      window.setTimeout(function() {
        var newText1 = $container.find('.fading-images__item[data-slide-index=' + target_title + ']').attr('data-slide-title1');
        var newText2 = $container.find('.fading-images__item[data-slide-index=' + target_title + ']').attr('data-slide-title2');
        $container.find('.fading-images-overlay__title--1').text(newText1);
        $container.find('.fading-images-overlay__title--2').text(newText2);
        $allTitles.addClass(classes.activeTitles);
      }, 750);

      // Begin timer
      var fading_titles_timer = window.setInterval(this.nextTitle.bind(this), this.data.interval);
    },

    onLoad: function() {
    },

    onSelect: function() {
    },

    onDeselect: function() {
    },

    onUnload: function() {
    }
  });

  return FadingImages;
})();

theme.Maps = (function() {
  var config = {
    zoom: 14
  };
  var apiStatus = null;
  var mapsToLoad = [];

  var errors = {
    addressNoResults: theme.strings.addressNoResults,
    addressQueryLimit: theme.strings.addressQueryLimit,
    addressError: theme.strings.addressError,
    authError: theme.strings.authError
  };

  var selectors = {
    section: '[data-section-type="map"]',
    map: '[data-map]',
    mapOverlay: '[data-map-overlay]'
  };

  var classes = {
    mapError: 'map-section--load-error',
    errorMsg: 'map-section__error errors text-center'
  };

  // Global function called by Google on auth errors.
  // Show an auto error message on all map instances.
  window.gm_authFailure = function() {
    if (!Shopify.designMode) {
      return;
    }

    $(selectors.section).addClass(classes.mapError);
    $(selectors.map).remove();
    $(selectors.mapOverlay).after(
      '<div class="' +
        classes.errorMsg +
        '">' +
        theme.strings.authError +
        '</div>'
    );
  };

  function Map(container) {
    this.$container = $(container);
    this.sectionId = this.$container.attr('data-section-id');
    this.namespace = '.map-' + this.sectionId;
    this.$map = this.$container.find(selectors.map);
    this.key = this.$map.data('api-key');

    if (!this.key) {
      return;
    }

    // Lazyload API
    this.checkVisibility();
    $(window).on('scroll' + this.namespace, $.throttle(50, this.checkVisibility.bind(this)));
  }

  function initAllMaps() {
    // API has loaded, load all Map instances in queue
    $.each(mapsToLoad, function(index, instance) {
      instance.createMap();
    });
  }

  function geolocate($map) {
    var deferred = $.Deferred();
    var geocoder = new google.maps.Geocoder();
    var address = $map.data('address-setting');

    geocoder.geocode({ address: address }, function(results, status) {
      if (status !== google.maps.GeocoderStatus.OK) {
        deferred.reject(status);
      }

      deferred.resolve(results);
    });

    return deferred;
  }

  Map.prototype = $.extend({}, Map.prototype, {
    prepMapApi: function() {
      if (apiStatus === 'loaded') {
        this.createMap();
      } else {
        mapsToLoad.push(this);

        if (apiStatus !== 'loading') {
          apiStatus = 'loading';
          if (typeof window.google === 'undefined') {
            $.getScript(
              'https://maps.googleapis.com/maps/api/js?key=' + this.key
            ).then(function() {
              apiStatus = 'loaded';
              initAllMaps();
            });
          }
        }
      }
    },

    createMap: function() {
      var $map = this.$map;

      return geolocate($map)
        .then(
          function(results) {
            var mapOptions = {
              zoom: config.zoom,
              backgroundColor: 'none',
              center: results[0].geometry.location,
              draggable: false,
              clickableIcons: false,
              scrollwheel: false,
              disableDoubleClickZoom: true,
              disableDefaultUI: true
            };

            var map = (this.map = new google.maps.Map($map[0], mapOptions));
            var center = (this.center = map.getCenter());

            var marker = new google.maps.Marker({
              map: map,
              position: map.getCenter()
            });

            google.maps.event.addDomListener(
              window,
              'resize',
              $.debounce(250, function() {
                google.maps.event.trigger(map, 'resize');
                map.setCenter(center);
                $map.removeAttr('style');
              })
            );
          }.bind(this)
        )
        .fail(function() {
          var errorMessage;

          switch (status) {
            case 'ZERO_RESULTS':
              errorMessage = errors.addressNoResults;
              break;
            case 'OVER_QUERY_LIMIT':
              errorMessage = errors.addressQueryLimit;
              break;
            case 'REQUEST_DENIED':
              errorMessage = errors.authError;
              break;
            default:
              errorMessage = errors.addressError;
              break;
          }

          // Show errors only to merchant in the editor.
          if (Shopify.designMode) {
            $map
              .parent()
              .addClass(classes.mapError)
              .html(
                '<div class="' +
                  classes.errorMsg +
                  '">' +
                  errorMessage +
                  '</div>'
              );
          }
        });
    },

    checkVisibility: function() {
      if (theme.isElementVisible(this.$container)) {
        this.prepMapApi();
        $(window).off(this.namespace);
      }
    },

    onUnload: function() {
      if (this.$map.length === 0) {
        return;
      }
      // Causes a harmless JS error when a section without an active map is reloaded
      google.maps.event.clearListeners(this.map, 'resize');
    }
  });

  return Map;
})();

theme.Blog = (function() {

  function Blog(container) {
    this.tagFilters();
  }

  Blog.prototype = $.extend({}, Blog.prototype, {
    tagFilters: function() {
      var $filterBy = $('#BlogTagFilter');

      if (!$filterBy.length) {
        return;
      }

      $filterBy.on('change', function() {
        location.href = $(this).val();
      });
    },

    onUnload: function() {

    }
  });

  return Blog;
})();

theme.inIframe = function() {
  try {
    return parent.document.location.hostname !== document.location.hostname;
  } catch (e) {
    return true;
  }
}

theme.config = {
  bpSmall: false,
  hasSessionStorage: true,
  mediaQuerySmall: 'screen and (max-width: 589px)',
  mediaQueryMediumUp: 'screen and (min-width: 590px)',
  youTubeReady: false,
  vimeoReady: false,
  vimeoLoading: false,
  preloadImages: true,
  isTouch: false,
  isIframe: theme.inIframe()
};

function onYouTubeIframeAPIReady() {
  theme.config.youTubeReady = true;
  $('body').trigger('youTubeReady');
}

function loadYouTube() {
  if (theme.config.youtubeReady) {
    return;
  }

  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function loadVimeo() {
  if (theme.config.vimeoLoading) {
    return;
  }

  if (!theme.config.vimeoReady) {
    theme.config.vimeoLoading = true;
    var tag = document.createElement('script');
    tag.src = "https://player.vimeo.com/api/player.js";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // Because there's no way to check for the Vimeo API being loaded
    // asynchronously, we use this terrible timeout to wait for it being ready
    checkIfVimeoIsReady()
      .then(function() {
        theme.config.vimeoReady = true;
        theme.config.vimeoLoading = false;
        $('body').trigger('vimeoReady');
      })
      .fail(function() {
        // No vimeo API to talk to
      });
  }
}

function checkIfVimeoIsReady() {
  var deferred = $.Deferred();
  var wait;
  var timeout;

  wait = setInterval(function() {
    if (!Vimeo) {
      return;
    }

    clearInterval(wait);
    clearTimeout(timeout);
    deferred.resolve();
  }, 500);

  timeout = setTimeout(function() {
    clearInterval(wait);
    deferred.reject();
  }, 4000); // subjective. test up to 8 times over 4 seconds

  return deferred;
}

theme.init = function() {
  theme.setGlobals();
  theme.pageTransitions();
  theme.initQuickShop();
  theme.videoModal();
  theme.articleImages.init();
  theme.backButton.init();
  theme.customerTemplates.init();
  theme.collapsibles.init();

  slate.rte.wrapTable();

  AOS.init({
    easing: 'ease-out-quad',
    once: true
  });
};

theme.setGlobals = function() {
  theme.config.hasSessionStorage = theme.isSessionStorageSupported() || theme.config.isIframe;
  theme.config.ie = theme.ieVersion();

  if (theme.config.ie <= 9) {
    theme.config.preloadImages = false;
  }

  window.addEventListener('touchstart', function onFirstTouch() {
    theme.config.isTouch = true;
    window.removeEventListener('touchstart', onFirstTouch, false);
    $('body').addClass('supports-touch');
  });

  enquire.register(theme.config.mediaQuerySmall, {
    match: function() {
      theme.config.bpSmall = true;
      $('body').trigger('matchSmall');
    },
    unmatch: function() {
      theme.config.bpSmall = false;
      $('body').trigger('unmatchSmall');
    }
  });

  enquire.register(theme.config.mediaQueryMediumUp, {
    match: function() {
      $('body').trigger('matchLarge');
    },
    unmatch: function() {
      $('body').trigger('unmatchLarge');
    }
  });
};

theme.ieVersion = function() {
  var undef;
  var v = 3;
  var div = document.createElement('div');
  var all = div.getElementsByTagName('i');

  while (
    div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
    all[0]
  );

  return v > 4 ? v : undef;
};

theme.preloadImages = function(container) {
  if (!theme.config.preloadImages) {
    fauxPreloadImages(container);
    return;
  }

  preloadImages(container);
}

theme.isSessionStorageSupported = function() {
  // Return false if we are in an iframe without access to sessionStorage
  if (window.self !== window.top) {
    return false;
  }

  var testKey = 'test';
  var storage = window.sessionStorage;
  try {
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

theme.isElementVisible = function($el) {
  return theme.isElementInViewport($el);
};

theme.isElementInViewport = function(el) {
  if (typeof jQuery === "function" && el instanceof jQuery) {
    el = el[0];
  }

  var rect = el.getBoundingClientRect();

  return (
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.left <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

theme.pageTransitions = function() {
  if ($('body').data('transitions') == true) {

    // Hack test to fix Safari page cache issue.
    // window.onpageshow doesn't always run when navigating
    // back to the page, so the unloading class remains, leaving
    // a white page. Setting a timeout to remove that class when leaving
    // the page actually finishes running when they come back.
    if (!!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/)) {
      $('a').on('click', function() {
        window.setTimeout(function() {
          $('body').removeClass('unloading');
        }, 1200);
      });
    }

    // Add disable transition class to malito or anchor links
    $('a[href^="mailto:"], a[href^="#"], a[target="_blank"]').each(function() {
      $(this).addClass('js-no-transition');
    });

    $('a:not(.js-no-transition)').bind('click', function(evt) {
      if (evt.metaKey) return true;
      evt.preventDefault();
      $('body').addClass('unloading');
      var src = $(this).attr('href');
      window.setTimeout(function() {
        location.href = src;
      }, 50);
    });

    $('.mobile-nav__link').bind('click', function() {
      theme.NavDrawer.close();
    });
  }
};

window.onpageshow = function(evt) {
  // Removes unload class when returning to page via history
  if (evt.persisted) {
    $('body').removeClass('unloading');
  }
};

$(document).ready(function() {
  theme.init();

  window.sections = new theme.Sections();
  sections.register('header-section', theme.HeaderSection);
  sections.register('slideshow-section', theme.SlideshowSection);
  sections.register('video-section', theme.VideoSection);
  sections.register('product', theme.Product);
  sections.register('product-template', theme.Product);
  sections.register('collection-template', theme.Collection);
  sections.register('featured-content-section', theme.FeaturedContentSection);
  sections.register('testimonials', theme.Testimonials);
  sections.register('instagram', theme.Instagram);
  sections.register('newsletter-popup', theme.NewsletterPopup);
  sections.register('fading-images', theme.FadingImages);
  sections.register('map', theme.Maps);
  sections.register('blog', theme.Blog);
});
