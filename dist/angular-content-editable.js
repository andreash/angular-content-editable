angular.module('angular-content-editable', []);

angular.module('angular-content-editable')

.directive('contentEditable', ['$log', '$sce', '$parse', '$window', 'contentEditable', function ($log, $sce, $parse, $window, contentEditable) {

  var directive = {
    restrict: 'A',
    require: 'ngModel',
    scope: { editCallback: '=',
      focusCallback: '=' ,
      keyDownCallback: '='}, //map functions from outer (controller) scope to directive scope
    link: _link
  }
  return directive;

  function _link(scope, elem, attrs, ngModel) {

    // return if ng model not specified
    if(!ngModel) {
      $log.warn('Error: ngModel is required in elem: ', elem);
      return;
    }

    var noEscape = true;
    var originalElement = elem[0];

    // get default usage options
    var options = angular.copy(contentEditable);

    // update options with attributes
    angular.forEach(options, function (val, key) {
      if( key in attrs ) {
        options[key] = $parse(attrs[key])(scope);
      }
    });
    
    // add editable class
    attrs.$addClass(options.editableClass);

    // render always with model value
    ngModel.$render = function() {
      elem.html( ngModel.$modelValue || elem.html() );
    }

    // handle click on element
    function onClick(e){
      e.preventDefault();
      attrs.$set('contenteditable', 'true');
      return originalElement.focus();
    }

    // check some option extra
    // conditions during focus
    function onFocus(e) {

      // turn on the flag
      noEscape = true;

      // select all on focus
      if( options.focusSelect ) {
        var range = $window.document.createRange();
        var selection = $window.getSelection();
        range.selectNodeContents( originalElement );
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // if render-html is enabled convert
      // all text content to plaintext
      // in order to modify html tags
      if( options.renderHtml ) {
        originalElement.textContent = elem.html();
      }
      
      if( scope.focusCallback && angular.isFunction(scope.focusCallback) ) {
        // apply the callback
        // with arguments: current text and element
        return scope.$apply( scope.focusCallback(elem.html(), elem) );
      }

    }

    function onBlur(e) {

      // the text
      var html;

      // disable editability
      attrs.$set('contenteditable', 'false');

      // if text needs to be rendered as html
      if( options.renderHtml && noEscape ) {
        // get plain text html (with html tags)
        // replace all blank spaces
        html = originalElement.textContent.replace(/\u00a0/g, " ");
        // update elem html value
        elem.html(html);

      } else {
        // get element content replacing html tag
        html = elem.html().replace(/&nbsp;/g, ' ');
      }

      // if element value is
      // different from model value
      if( html != ngModel.$modelValue ) {

        /**
        * This method should be called
        * when a controller wants to
        * change the view value
        */
        ngModel.$setViewValue(html)
        // if user passed a variable
        // and is a function
        if( scope.editCallback && angular.isFunction(scope.editCallback) ) {
          // apply the callback
          // with arguments: current text and element
          return scope.$apply( scope.editCallback(html, elem) );
        }
      }
    };

    function onKeyDown(e) {
      var keys_checked = false;
      if( scope.keyDownCallback && angular.isFunction(scope.keyDownCallback) ) {
        // apply the callback
        // with arguments: current text and element
        keys_checked = scope.$apply( scope.keyDownCallback(e, elem,getCaretPosition(elem)) );
      }
      
      if (!keys_checked) {
        if( e.which === 9 ) {
          // on tab key blur and
          // TODO: focus to next
          originalElement.blur();
          return;
        }
        else if( e.which === 27 ) {
          // on esc key roll back value and blur
          ngModel.$rollbackViewValue();
          noEscape = false;
          return originalElement.blur();
        }
        else if( e.which === 13 && (options.singleLine || e.ctrlKey) ) {
          // if single line or ctrl key is
          // pressed trigger the blur event
          return originalElement.blur();
        }
      }
    };

    /**
    * On click turn the element
    * to editable and focus it
    */
    elem.on('click', onClick);

    /**
    * On element focus
    */
    elem.on('focus', onFocus);

    /**
    * On element blur turn off
    * editable mode, if HTML, render
    * update model value and run callback
    * if specified
    */
    elem.on('blur', onBlur);

    /**
    * Bind the keydown event for many functions
    */
    elem.on('keydown', onKeyDown);

    /**
    * On element destroy, remove all event
    * listeners related to the directive
    * (helps to prevent memory leaks)
    */
    scope.$on('$destroy', function () {
      elem.off('click', onClick);
      elem.off('focus', onFocus);
      elem.off('blur', onBlur);
      elem.off('keydown', onKeyDown);
    });
  };
  
  function getCaretPosition(editable) {
    var caretPos = 0, sel, range;
    sel = window.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0);
      if (range.commonAncestorContainer.parentNode === editable[0]) {
        caretPos = range.endOffset;
      }
    }
    return caretPos;
  }

}])

angular.module('angular-content-editable')

/**
 * Provider to setup the default
 * module options for the directive
 */
.provider('contentEditable', function () {

  var defaults = {
    editableClass: 'editable',
    keyBindings: true, // default true for key shortcuts
    singleLine: false,
    focusSelect: true, // default on focus select all text inside
    renderHtml: false,
    editCallback: false
  }

  this.configure = function (options) {
    return angular.extend(defaults, options);
  }

  this.$get = function () {
    return defaults;
  }

});
