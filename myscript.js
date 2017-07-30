// given n it returns n rounded to 2 decimal places
// ex: 12.345 -> 12.35
function roundToTwo (n) {
  var multiplicator = Math.pow(10, 2);
  n = parseFloat((n * multiplicator).toFixed(11));
  return (Math.round(n) / multiplicator).toFixed(2);
}

// Translate a unit into the pretty version (that looks like Amazon's) so it can be
// displayed properly
function getFormatedUnits (arg) {
  var lowered = arg.toLowerCase();

  if (lowered.indexOf('fl.oz.') != -1) { return 'Ounce'; }
  if (lowered.indexOf('fl oz') != -1) { return 'Ounce'; }
  if (lowered.indexOf('gallon') != -1) { return 'Gallon'; }
  if (lowered.indexOf('pound') != -1) { return 'Pound'; }
  if (lowered.indexOf('ounce') != -1) { return 'Ounce'; }
  if (lowered.indexOf('oz') != -1) { return 'Ounce'; }
  if (lowered.indexOf('oz.') != -1) { return 'Ounce'; }
  if (lowered.indexOf('ml') != -1) { return 'ml'; }
  if (lowered.indexOf('g') != -1) { return 'Gram'; }
  if (lowered.indexOf('gram') != -1) { return 'Gram'; }
  if (lowered.indexOf('pack') != -1) { return 'Pack'; }
  if (lowered.indexOf('dram') != -1) { return 'Dram'; }
  if (lowered.indexOf('count') != -1) { return 'Item'; }

  return arg;
}

var ppoRegex = /\$\d+\.\d+\/.*/; // ex: ($0.24/Count), ($1.37/Ounce), ...
// ex: 2 Gallons, .32 fl oz, ...
var unitRegex1 = /(((\d*\.)?\d+)(\ )?(fl\.oz\.|fl\ oz|fl\ ozs|Fl\ Oz|Fl\ Ozs|Pound|pound|Pounds|pounds|Gallon|gallon|Gallons|gallons|Ounce|ounce|Ounces|ounces|Oz|oz|Oz\.|oz\.|Ml|ml|mls|Gram|G|g|gram))/;
// ex: 2 Packs, 2 count, ...
var unitRegex2 = /(((\d*\.)?\d+)(\ )?(Pack|pack|Packs|packs|Dram|dram|Drams|drams|Count|count))/;

/*
2 types of item results containers:
#resultsCol - https://www.amazon.com/s/ref=nb_sb_noss?url=search-alias%3Dgarden&field-keywords=tea&rh=n%3A1055398%2Ck%3Atea
#container - https://www.amazon.com/b/ref=br_asw_smr?_encoding=UTF8&node=16978655011&sort=date-desc-rank&pf_rd_m=ATVPDKIKX0DER&pf_rd_s=&pf_rd_r=F8HCKG31C15ZKAE46VB8&pf_rd_t=36701&pf_rd_p=c5920522-1a61-46c1-870c-8eed77884fda&pf_rd_i=desktop
Most are #resultsCol
*/
if (jQuery('#resultsCol').length > 0) {
  var elems = jQuery('.s-item-container a span > span').filter(function() {return jQuery(this).children('sup').length == 2 && jQuery(this).children('span').length == 1});
  var parentAnchor = elems.closest('a');  
  // There are 2 kinds of ppo elements: some anchors contain the ppo others have the ppo above them.
  var noPpo = parentAnchor.filter(function() {
    var e = jQuery(this);

    // has child span with ppo in the text and no children
    var ppo1 = e.children('span').filter(function () {
      return ppoRegex.test(jQuery(this).text()) && jQuery(this).children().length == 0;
    });
    if (ppo1.length != 0) return false;

    // parent has child span with ppo in the text and no children
    var ppo2 = e.parent().children('span').filter(function () {
      return ppoRegex.test(jQuery(this).text()) && jQuery(this).children().length == 0;
    });

    return (ppo2.length == 0);
  });

  // For each item found with out price per unit, try to figure and display the price per unit
  noPpo.each(function(idx) {
    var jQueryItem = jQuery(this);
    var href = jQueryItem.attr('href');
    // fetch the item page and try to parse out the unit info
    jQuery.get(href, function(data) {
      var data = jQuery.parseHTML(data);
      /*
      Look for a parse case that works.
      The prefered order is title, center column (below title), then product details.
      Also the prefered order is unitRegex1 (normal units) over unitRegex2 (abnormal units)
      */
      var parseCases = [
        { unitRegex: unitRegex1, elemSelector: '#productTitle' },
        { unitRegex: unitRegex2, elemSelector: '#productTitle' },
        { unitRegex: unitRegex1, elemSelector: '#centerCol' },
        { unitRegex: unitRegex2, elemSelector: '#centerCol' },
        { unitRegex: unitRegex1, elemSelector: '#prodDetails' },
        { unitRegex: unitRegex2, elemSelector: '#prodDetails' }
      ];
      var regexResults = null;
      for (var i=0; i<parseCases.length && regexResults == null; ++i) {
        var unitRegex = parseCases[i].unitRegex;
        var elemSelector = parseCases[i].elemSelector;
        regexResults = unitRegex.exec(jQuery(elemSelector, data).text());
      }

      // if we successfully parsed the item's page the calculate the price per unit and display it
      if (regexResults != null) {
        var rawAmmount = /\.*(\d+).*/.exec(jQueryItem.text().replace(/\s/g, ''))[1];
        // text() returns ####### which means #####.## (last 2 numbers are the decimal value)
        var ammount = parseFloat(rawAmmount.substring(0, rawAmmount.length - 2) + '.' + rawAmmount.substring(rawAmmount.length - 2));
        var units = parseFloat(regexResults[2]);
        var ppo = roundToTwo(ammount / units);
        var unit = getFormatedUnits(regexResults[5]);
        // if ppu is $0.00 then show $0.01
        // ex: $12.50/Pound
        var ppoFormated = '$' + (ppo == '0.00' ? '0.01' : ppo) + '/' + unit;
        // insert the ppu like Amazon does
        jQueryItem.append("<span class=\"a-letter-space\"></span><span class=\"a-size-base a-color-base\">(" + ppoFormated + ")</span>");
      }
    });
  });
} else if (jQuery('#container').length > 0) {
  var elems = jQuery('.s-item-container a > span:contains("$")');
  var parentAnchor = elems.closest('a');
  // todo
} else {
  // console.err('Could not find base container.');
}

