var paayformArr = ["checkout_form", "is-upsell", "downsell_form1"];
var errorClass = "has-error";
var validClass = "no-error";
var dev_mode = app_config.dev_mode;
var timeout = 5;
var enable_loader = true;
var numberOfCalls = 0;
var oldNumberOfCalls = 0;
var callArray = [];
var oldCallArray = [];
var isTrigger = false;
var prevString = "";
var is_process_started = false;
var isLegacy = true;
var pstep;
var pstep_prices;
var valid_steps;
var is_evaluated = false;
var is_threeds_verified = false;
var threeds_response = [];
var finallyReceived = false;
var threeDsErr;
var errMsg;
var challengeWaitText;
var challengeTimeOutText;
var transactionNotPermittedText;
$(function () {
  var formName = $("form").attr("name");
  var mainhtml = "";
  var apiData = {
    amount: "amount",
    expmonth: "month",
    expyear: "year",
    creditCardNumber: "pan",
  };
  if (formName == "prospect_form1") {
    return;
  }
  if (paayformArr.indexOf(formName) != -1 && typeof paay_3D_settings !== "undefined")
  {
    errMsg = paay_3D_settings && paay_3D_settings['order_decline_message'] && paay_3D_settings['order_decline_message'].length > 0 ? paay_3D_settings['order_decline_message'] : 'Card verification process has been failed, please try again!'
    var currentStep = app_config.current_step;
    currentStep = 'step'.concat(currentStep);

    currentStep = paay_3D_settings[currentStep]
    
    // assigning challenge texts
    challengeWaitText = paay_3D_settings['challenge_wait_text'] ? paay_3D_settings['challenge_wait_text'] : 'No result found for transaction as yet. Please subscribe again';
    challengeTimeOutText = paay_3D_settings['challenge_time_out_text'] ? paay_3D_settings['challenge_time_out_text'] : 'this transaction timed out. the client requested that this transaction be forced timeout after ';
    transactionNotPermittedText = paay_3D_settings['transaction_not_permitted_text'] ? paay_3D_settings['transaction_not_permitted_text'] : 'Transaction not permitted to cardholder';
    
    if (currentStep.main == false && currentStep.rebill == false) {
      return;
    }

    timeout = paay_3D_settings["timeout"];
    enable_loader = paay_3D_settings["enable_loader"];
    event_type = paay_3D_settings["verify_on_submit"];
    if (paay_3D_settings.version == 2) {
      isLegacy = false;
    }

    if (timeout == "") {
      timeout = 5;
    } else {
      timeout = parseInt(timeout);
    }

    var currStp = paay_3D_settings.step_id;
    pstep = paay_3D_settings["step" + currStp];
    pstep_prices = paay_3D_settings["prices" + currStp];

    // Getting number of calls.
    let pstepEntries = Object.entries(pstep);
    for (const [key, value] of pstepEntries) {
      if (value == true) {
        callArray.push(key);
      }
      value == true ? numberOfCalls++ : "";
    }
    // Adding style to iframe
    const style = document.createElement("style");
    style.innerHTML = `
        #paay-iframe{
            position: fixed;p[name]
            right: 0;
            width: 100%;
            height:100%;
            border: 0;
            top: 0;
            margin-left: auto;
            margin-right: auto;
            left: 0;
            z-index: 99999999999999;
        }                
        `;
    document.head.append(style);
    if ($("form[name=" + formName + "]").length) {
      $("head").append(
        '<link rel="stylesheet" type="text/css" href="' +
          paay_3D_settings.paay_extension_url +
          'css/paay.css">'
      );

      for (var key in apiData) {
        if ($("[name=" + key + "]").length) {
          $("[name=" + key + "]").attr("data-threeds", apiData[key]);
        }
      }
      if (pstep.main) {
        mainhtml += '<input type="hidden" name="cavv" id="cavv" value="" />';
        mainhtml += '<input type="hidden" name="eci" id="eci" value="" />';
        mainhtml += '<input type="hidden" name="xid" id="xid" value="" />';
        mainhtml += '<input type="hidden" name="status" id="status" value="" />';
        mainhtml += '<input type="hidden" id="amt" value="' + pstep_prices.main + '">';
        if (!isLegacy) {
          mainhtml += '<input type="hidden" name="protocolVersion" id="protocolVersion" value="" />';
          mainhtml += '<input type="hidden" name="authenticationValue" id="authenticationValue" value="" />';
          mainhtml += '<input type="hidden" name="dsTransactionId" id="dsTransactionId" value="" />';
        }
      }

      if (pstep.rebill || paay_3D_settings.skip_trial_protection) {
        mainhtml += '<input type="hidden" name="rebill_cavv" id="rebill_cavv" value="" />';
        mainhtml += '<input type="hidden" name="rebill_eci" id="rebill_eci" value="" />';
        mainhtml += '<input type="hidden" name="rebill_xid" id="rebill_xid" value="" />';
        mainhtml += '<input type="hidden" name="rebill_status" id="rebill_status" value="" />';
        mainhtml += '<input type="hidden" name="rebill_protocolVersion" id="rebill_protocolVersion" value="" />';
        mainhtml += '<input type="hidden" name="rebill_authenticationValue" id="rebill_authenticationValue" value="" />';
        mainhtml += '<input type="hidden" name="rebill_dsTransactionId" id="rebill_x`dsTransactionId" value="" />';
        if (!(paay_3D_settings.skip_trial_protection)) {
          mainhtml += '<input type="hidden" id="rebill_amt" value="' + pstep_prices.rebill + '">';
        }
      }
      if (pstep.split_main) {
        mainhtml += '<input type="hidden" name="split_cavv" id="split_cavv" value="" />';
        mainhtml += '<input type="hidden" name="split_eci" id="split_eci" value="" />';
        mainhtml += '<input type="hidden" name="split_xid" id="split_xid" value="" />';
        mainhtml += '<input type="hidden" name="split_status" id="split_status" value="" />';
        mainhtml += '<input type="hidden" id="split_main_amt" value="' + pstep_prices.split_main + '">';
        if (!isLegacy) {
          mainhtml += '<input type="hidden" name="split_protocolVersion" id="split_protocolVersion" value="" />';
          mainhtml += '<input type="hidden" name="split_authenticationValue" id="split_authenticationValue" value="" />';
          mainhtml += '<input type="hidden" name="split_dsTransactionId" id="split_dsTransactionId" value="" />';
        }
      }
      if (pstep.split_rebill) {
        mainhtml += '<input type="hidden" name="split_rebill_cavv" id="split_rebill_cavv" value="" />';
        mainhtml += '<input type="hidden" name="split_rebill_eci" id="split_rebill_eci" value="" />';
        mainhtml += '<input type="hidden" name="split_rebill_xid" id="split_rebill_xid" value="" />';
        mainhtml += '<input type="hidden" name="split_rebill_status" id="split_rebill_status" value="" />';
        mainhtml += '<input type="hidden" id="split_rebill_amt" value="' + pstep_prices.split_rebill + '">';
        if (!isLegacy) {
          mainhtml += '<input type="hidden" name="split_rebill_protocolVersion" id="split_rebill_protocolVersion" value="" />';
          mainhtml += '<input type="hidden" name="split_rebill_authenticationValue" id="split_rebill_authenticationValue" value="" />';
          mainhtml += '<input type="hidden" name="split_rebill_dsTransactionId" id="split_rebill_dsTransactionId" value="" />';
        }
      }

      if (currStp > 1) {
        mainhtml += '<input name="creditCardType" value="' + pstep.cardType + '"  type="hidden"/>';
        mainhtml += '<input name="expmonth" value="' + pstep.expmonth + '" type="hidden" data-threeds="month" />';
        mainhtml += '<input name="expyear" value="' + pstep.expyear + '"  type="hidden" data-threeds="year"/>';
        mainhtml += '<input name="creditCardNumber" value="' + pstep.creditCardNumber + '"  type="hidden" data-threeds="pan"/>';
      }
      $("form[name=" + formName + "]").append(mainhtml);
    }
    var form = document.createElement("form");
    form.setAttribute("method", "post");
  }
  if (enable_loader) {
    if (typeof event_type !== "undefined" && event_type == "new_version") {
      cb.beforeFormSubmitEvents.push(function (formElement, formOptions) {
        checkCardData(formElement)
          .then(function (value1) {
            return startLoading();
          })
          .then(function (value2) {
            // If no step is selected
            if (
              paay_3D_settings == undefined ||
              (!pstep.main && !pstep.rebill && !pstep.split_rebill && !pstep.split_main)
            ) {
              if (!is_evaluated) {
              }
              cb.submitForm(formElement, formOptions);
            } else {
              if (!is_evaluated) {
              }
              cb.submitForm(formElement, formOptions);
            }
          })
          .catch(function (error) {
            console.error('Error during form submission:', error);
            storeLog(['Error during form submission:',error], 'main', 'pay-call.js-response');
            // Handle the error appropriately here
          });
      });
    }
  }
});
function promptFn() {
  $("#loading-indicator").hide();
}
function randomString() {
  return "id-" + Math.random().toString(36).substr(2, 16);
}
function startLoading() {
  return new Promise(function (resolve, reject) {
    if (typeof paay_3D_settings === "undefined") {
      return resolve();
    }
    
    if(threeds_response.length == 0 || !is_threeds_verified){
        return resolve();
    }
    if (!pstep.main && !pstep.rebill && !pstep.split_rebill && !pstep.split_main) {
        return resolve();
    }

    var time = timeout;
    var timer = setInterval(function () {
      var card_status = $("#status").val();
      var rebill_card_status = $("#rebill_status").val();
      var split_rebill_status = $("#split_rebill_status").val();
      var split_status = $("#split_status").val();

      var isdataFilled = false;
      if (
        (typeof card_status != "undefined" || typeof rebill_card_status != "undefined" || 
          typeof split_rebill_status != "undefined" || typeof split_status != "undefined" 
          ) &&
        (card_status != "" || rebill_card_status !="" || split_status != "" || split_rebill_status != "")
      ) {
        isdataFilled = true;
      }
      time--;
      if (!isTrigger || isdataFilled || time === 0) {
        clearInterval(timer);
        return resolve();
      }
      // If no step is selected
      if (!pstep.main && !pstep.rebill && !pstep.split_rebill && !pstep.split_main) {
        clearInterval(timer);
        return resolve();
      }
    }, 1000);
  });
}
function checkCardData(formElement) {
  return new Promise(function (done, notdone) {
    $("#loading-indicator").show();

    var formName = $("form").attr("name");
    var ahtml = getFormValues(formName);

    if (
      paayformArr.indexOf(formName) == -1 ||
      typeof paay_3D_settings === "undefined"
    ) {
      return done();
    }

    if (!$("form[name=" + formName + "]").length) {
      return done();
    }

    var selector = "";
    if (formName == "is-upsell") {
      selector = "input";
    } else {
      selector = "select";
    }
    var validCCType = ["visa", "master", "amex", "discover"];
    var m = $(selector + "[name=expmonth]").val();
    var y = $(selector + "[name=expyear]").val();
    var cc = $("input[name=creditCardNumber]").val();
    var ccType = $(selector + "[name=creditCardType]").val();
    var currStp = paay_3D_settings.step_id;
    var fData = $("form[name=" + formName + "]").serializeArray();
    var additionalHtml = getAdditionalParamsHtml(ccType, ahtml, fData);
    $("form[name=" + formName + "]").append(additionalHtml);
    if ($.inArray(ccType, validCCType) == "-1" && currStp == 1) {
      return done();
    }

    var binVerify = paay_3D_settings.enable_bin_verify;
    if (typeof binVerify != "undefined" && binVerify) {
      var unmaskedCardNumber = cc.trim().replace(/[\s-]/g, "");
      if (typeof unmaskedCardNumber != "undefined" && unmaskedCardNumber.length < 6)
      {
        return done();
      }
      var binData = cb.decryptAllowedTestCard(paay_3D_settings.bin);
      var binArray = binData.split("\n");
      var checkingType = paay_3D_settings.action_on_bin;
      var bin = unmaskedCardNumber.substr(0, 6);
      var isBinInList = $.inArray(bin, binArray);
      if (typeof checkingType != "undefined" && checkingType == "exclude" && isBinInList != "-1")
      {
        if (typeof dev_mode != "undefined" && dev_mode == "Y") {
        }
        return done();
      }

      if (typeof checkingType != "undefined" && checkingType == "include" && isBinInList == "-1")
      {
        if (typeof dev_mode != "undefined" && dev_mode == "Y") {
        }
        return done();
      }
    }
    cc = cc.replace(/-/g, "");
    pstep = paay_3D_settings["step" + currStp];
    pstep_prices = paay_3D_settings["prices" + currStp];

    valid_steps = paay_3D_settings["valid_steps"];

    /*
     * Start New Card Type Filter Logic
     */
    var cardTypeSettings = pstep["card_type"];
    let pstepEntries = Object.entries(pstep);
    for (const [key, value] of pstepEntries) {
      if (value == true && valid_steps[key] == true) {
        if (!callArray.includes(key)) {
            callArray.push(key);
            numberOfCalls++;              
        }
      }
    }      

    oldCallArray = []
    oldNumberOfCalls = 0
    if(typeof(cardTypeSettings) != 'undefined' && cardTypeSettings.length) {
        pstep.rebill = false;
        pstep.main = false;
        pstep.split_main = false;
        pstep.split_rebill = false;
        oldCallArray = callArray
        oldNumberOfCalls = numberOfCalls
        callArray = []
        numberOfCalls = 0

        // Adding All type configurations
        var allTypes = cardTypeSettings.filter(type => 
          type.includes('all')
        );
        if(allTypes.length > 0){
          allTypes.some(type => {
            var calltext = type.includes('initial') ? type.replace('initial', 'main') : type
            calltext = calltext.replace('_all', '')
            pstep[calltext] = true;
            callArray.push(calltext);
            numberOfCalls++
          })
        }

        // Adding Card specific configurations
        if(cardTypeSettings.indexOf('rebill_'+ccType) != -1 && callArray.indexOf('rebill') == -1)
        {
          pstep.rebill = true;
          callArray.push('rebill');
          numberOfCalls++
        }
        
        if(cardTypeSettings.indexOf('initial_'+ccType) != -1 && callArray.indexOf('main') == -1)
        {                    
          pstep.main = true;
          callArray.push('main');
          numberOfCalls++
        }

        if(cardTypeSettings.indexOf('split_initial_'+ccType) != -1 && callArray.indexOf('split_main') == -1)
        {
          pstep.split_main = true;
          callArray.push('split_main');
          numberOfCalls++
        }

        if(
            cardTypeSettings.indexOf('split_rebill_'+ccType) != -1 && callArray.indexOf('split_rebill') == -1)
        {
          pstep.split_rebill = true;
          callArray.push('split_rebill');
          numberOfCalls++
        }

    } 

    // Applying N status to invalid calls
    if(oldCallArray.length > 0 && JSON.stringify(oldCallArray) != JSON.stringify(callArray)){
      let callDifference = oldCallArray.filter(x => !callArray.includes(x));
      if(callDifference.length > 0){
        callDifference.some(calldiff => {
          if(calldiff == 'main'){
            $("[name=status]").val('N');
          }
          else if(calldiff == 'split_main'){
            $("[name=split_status]").val('N');
          }
          else{
            $(`[name=${calldiff}_status]`).val('N');
          }
        });
      }
    }


    /*
     * End New Card Type Filter Logic
     */

    // Getting number of calls.
    if (numberOfCalls == 0) {
      return done();
    }

    if (m != "" && y != "" && cc != "" && (pstep.main || pstep.rebill || pstep.split_main || pstep.split_rebill))
    {
      try {
        if (is_process_started) {
          console.log("ANOTHER PROCESS IS ALREADY RUNNING, PLEASE WAIT...");
          return done();
        }
        if ((prevString != "" && prevString == m + y + cc) && finallyReceived) {
          return done();
        }

        isTrigger = true;

        var strict_method = paay_3D_settings["strict_method"];
        if (strict_method) {
          $("form").find("[type=submit]").attr("disabled", "disabled");
        }
        var formid = $("form[name=" + formName + "]").attr("id");
        timeout = paay_3D_settings["max_timeout"];
        prevString = m + y + cc;

        is_process_started = true;
    
        try {
          threeds_response = [];
          
          const processThreeDsApi = (callObj) =>
            new Promise((processed, notprocessed) => {
              var postData = {
                autoSubmit: true,
                allowRetry: true,
                iframeId: "paay-iframe",
                timeout: paay_3D_settings["max_timeout"],
                showChallenge: (paay_3D_settings?.challenge_type != null) ? false : false, //paay_3D_settings["show_challenge"],
                // showChallenge: false,
                forcedTimeout: paay_3D_settings["challenge_timeout"],
                rebill: 0,
                authenticationId: "01",
                messageCategory: "01",
                rebill_resolve: (rebill_resolve) => {

                },
                // rebill_reject: (rebill_reject) => {
                // },
                resolve: (resolve) => {
                //   if(resolve.cardholderInfo == `this transaction timed out. the client requested that this transaction be forced timeout after ${paay_3D_settings["max_timeout"]}s` || resolve.transStatusReasonDetail == "Transaction not permitted to cardholder"){
                if((resolve.cardholderInfo != 'undefined' && resolve.cardholderInfo == `${challengeTimeOutText} ${paay_3D_settings["max_timeout"]}s`) || (resolve.transStatusReasonDetail != 'undefined' && resolve.transStatusReasonDetail == transactionNotPermittedText)){
                    is_process_started = false;
                    finallyReceived = false;
                    cb.errorHandler([errMsg],formElement);
                    notprocessed();
                  }else{
                    is_process_started =true;
                    setFormValues(callObj, resolve, "success");
                    processed();
                  }
                  
                },
                reject: (reject) => {
                    threeDsErr = JSON.parse(reject);
                  is_process_started = false;
                  finallyReceived = false;
                  if(threeDsErr.error != 'undefined' && threeDsErr.error != challengeWaitText){
                    notprocessed();
                  }
                  
                },
              };
              postData["popupFail"] = (formElement) => {
                cb.errorHandler(
                  ["Popup is blocked in your browser"],
                  formElement
                );
              };

              if (paay_3D_settings["challenge_type"] == "popup") {
                postData["popup"] = true;
              } else {
                postData["showIframe"] = true;
              }

              if (typeof dev_mode != "undefined" && dev_mode == "Y") {
                postData["verbose"] = true;
              }

              if (typeof formid === "undefined") {
                $("form[name=" + formName + "]").attr("id", formName);
                formid = formName;
              }
              var demoMode = paay_3D_settings["demo_mode"];

              if (demoMode) {
                $sandboxURL = "https://sandbox-api.3dsintegrator.com";
                if (!isLegacy) {
                  $sandboxURL = "https://api-sandbox.3dsintegrator.com/v2.2";
                }
                postData["endpoint"] = $sandboxURL;
              }
              
              postData["prompt"] = promptFn;
              postData["addResultToForm"] = false;
              
              var tdsobj = new ThreeDS(
                formid,
                paay_3D_settings["api_key"],
                null,
                postData
              );
              storeLog(postData, callObj);
              // Added custom prices to form
              pstep_prices.rebill = $("#rebill_amt").length ? parseFloat($("#rebill_amt").val()) : 0;
              pstep_prices.main = $("#amt").length ? parseFloat($("#amt").val()) : 0;
              pstep_prices.split_main = $("#split_main_amt").length ? parseFloat($("#split_main_amt").val()) : 0;
              pstep_prices.split_rebill = $("#split_rebill_amt").length ? parseFloat($("#split_rebill_amt").val()) : 0;
              tdsobj.verify(
                (success) => {
                storeLog(success, callObj, 'pay-call.js-response');
                   is_process_started = true;
                                    finallyReceived = true;
                                    // if (success.status == 'N' && paay_3D_settings['disable_non_3ds_card']) {
                                    if (paay_3D_settings['disable_non_3ds_card'] && (success.authenticationValue =='undefined' || success.authenticationValue =='' || success.status == 'N' || success.status == 'R')) {
                                        is_process_started = false;
                                        finallyReceived = false;
                                        cb.errorHandler(
                                            [errMsg],
                                            formElement
                                        );
                                        $('#loading-indicator').hide();
                                        notdone();

                                    }else if (success.authenticationValue =='' || success.status == 'N' || success.status == 'R') {
                                        is_process_started = false;
                                        finallyReceived = false;
                                        
                                        $('#loading-indicator').hide();
                                        //notdone();
                                        setFormValues(callObj, success, "success");
                                        processed();
                                    } 
                                    else {
                                        setFormValues(callObj, success, "success");
                                        processed();
                                    }
                },
                (failure) => {
                 storeLog(failure, callObj, 'pay-call.js-response');
                  let threeDError = JSON.parse(failure);
                  
                  if(threeDError.error != 'undefined' && threeDError.error == challengeWaitText){
                    notprocessed();
                  }else if (paay_3D_settings['disable_non_3ds_card']) {
                     is_process_started = false;
                     finallyReceived = false;
                      cb.errorHandler(
                          [errMsg],
                          formElement
                      );
                      $('#loading-indicator').hide();
                      notdone();
                  }else{
                    processed();
                  }

                },
                { amount: pstep_prices[callObj] },
                null,
                null,
                (rebill_resolve) =>
                  console.log(
                    "Verify method Rebill Resolve function called. Response:",
                    rebill_resolve
                  ),
                (rebill_reject) =>
                  console.log(
                    "Verify method Rebill Reject function called. Error:",
                    rebill_reject
                  )
              );
            });
            (async function loop() {
              try {
                for (let i = 0; i < callArray.length; i++) {
                  await processThreeDsApi(callArray[i]);
                }
                await callSubmit(done, notdone, formElement);
              } catch (err) {
                // Handle errors
                storeLog([err, threeDsErr], 'main', 'pay-call.js-response');
                is_process_started = false;
                finallyReceived = false;
                $('#loading-indicator').hide();
              }
            })();

        } catch (err) {
          console.log("Err:", err);
          is_process_started = false;
        }
      } catch (err) {
        console.log("Err:", err);
        is_process_started = false;
      }
    } else {
        is_process_started = false
        return done();
    }
  });
}

    function get_iso_code(fData,fieldName){
        var countryData = fData.filter((obj) => obj.name ==fieldName);
        if(countryData.length > 0){
            var iso_code = country_codes[countryData[0].value];
            return iso_code;
        }
    }
function get_phone_code(fData, fieldName) {
  var phoneData = fData.filter((obj) => obj.name == fieldName);
  if (phoneData.length > 0) {
    var phone_code_json = JSON.parse(phone_codes);
    var phone_code = phone_code_json[phoneData[0].value];
    return phone_code;
  }
}
function getFormValues(formName) {
  var ahtml = [];
  var fData = $("form[name=" + formName + "]").serializeArray();
  // ccType
  var ccType = fData.filter((obj) => obj.name == "creditCardType");

  if (ccType.length > 0) {
    var shippingKeys = [
      "shippingAddress1",
      "shippingCity",
      "shippingZip",
      "shippingState",
      "firstName",
      "lastName",
      "email",
       "phone"
    ];
    shippingKeys.some((key) => {
      var sData = fData.filter((obj) => obj.name == key);
      if (sData.length > 0) {
        ahtml[key] = sData[0].value;
      }
    });

    var billingKeys = [
      {
        key: "billingAddress1",
        eqKey: "shippingAddress1",
      },
      {
        key: "billingCity",
        eqKey: "shippingCity",
      },
      {
        key: "billingState",
        eqKey: "shippingState",
      },
      {
        key: "billingZip",
        eqKey: "shippingZip",
      },
    ];
    var iso_code = get_iso_code(fData, "shippingCountry");
    if (iso_code != "") {
      ahtml["shippingCountry"] = iso_code;
    }

    var billingSameAsShippingData = fData.filter((obj) => obj.name == "billingSameAsShipping");
    billingKeys.some((dataObj, i) => {
      if (billingSameAsShippingData.length > 0 && billingSameAsShippingData[0].value == "yes")
      {
        var sData = fData.filter((obj) => obj.name == dataObj.eqKey);
        ahtml["billingCountry"] = iso_code;
        ahtml["addrMatch"] = "Y";
      }
      else
      {
        var sData = fData.filter((obj) => obj.name == dataObj.key);
        var iso_code2 = get_iso_code(fData, "billingCountry");
        if (iso_code2 != "") {
          ahtml["billingCountry"] = iso_code2;
        }
        ahtml["addrMatch"] = "N";
      }
      if (sData.length > 0) {
        ahtml[dataObj.key] = sData[0].value;
      }
    });
    var emailData = fData.filter((obj) => obj.name == "email");
    var email = emailData.length > 0 ? emailData[0].value : "";

    ahtml["email"] = email;

    return ahtml;
  }
}
function getAdditionalParamsHtml(ccType, ahtml, fData) {
  var additionalHtml = "";
  if (ccType == "amex") {
    var amexPayload = [
      {
        name: "shippingLine1",
        value:
          paay_3D_settings["shippingLine"] != null
            ? paay_3D_settings["shippingLine"]
            : ahtml["shippingAddress1"],
      },
      {
        name: "shippingLine2",
        value: "",
      },
      {
        name: "shippingLine3",
        value: "",
      },
      {
        name: "shippingPostCode",
        value:
          paay_3D_settings["shippingPostCode"] != null
            ? paay_3D_settings["shippingPostCode"]
            : ahtml["shippingZip"],
      },
      {
        name: "shippingCity",
        value:
          paay_3D_settings["shippingCity"] != null
            ? paay_3D_settings["shippingCity"]
            : ahtml["shippingCity"],
      },
      {
        name: "shipIndicator",
        value:
          paay_3D_settings["shipIndicator"] != null
            ? paay_3D_settings["shipIndicator"]
            : "1",
      },
      {
        name: "shippingState",
        value:
          paay_3D_settings["shippingState"] != null
            ? paay_3D_settings["shippingState"]
            : ahtml["shippingState"],
        condition:
          (paay_3D_settings["shippingState"] != null &&
            paay_3D_settings["shippingState"].trim().length >= 1 &&
            paay_3D_settings["shippingState"].trim().length <= 3) ||
          (ahtml["shippingState"] != undefined &&
            ahtml["shippingState"].trim().length >= 1 &&
            ahtml["shippingState"].trim().length <= 3),
      },
      {
        name:'shippingCountry',
        value: paay_3D_settings['additionalShippingCountry'] != null ? paay_3D_settings['additionalShippingCountry'] : ahtml['shippingCountry'],
        condition: (paay_3D_settings['additionalShippingCountry'] != null && paay_3D_settings['additionalShippingCountry'] != undefined) || ahtml['shippingCountry'] != undefined
      },
    ];
    amexPayload.some((data) => {
      if (data.condition === undefined || data.condition == true) {
        additionalHtml += `<input data-threeds="${data.name}" name="${data.name}" class="paay_additional_param" type="hidden" value="${data.value}">`;
      }
    });
  }
  if (ccType == "discover") {
    var cardHolderName = ahtml["firstName"] + " " + ahtml["lastName"];
    additionalHtml += `<input data-threeds="cardHolderName" name="cardHolderName" class="paay_additional_param" type="hidden" value="${
      paay_3D_settings["cardHolderName"].trim().length != 0
        ? paay_3D_settings["cardHolderName"]
        : cardHolderName
    }">`;
  }
  var otherCCPayload = [
    {
      name: "billingLine1",
      value:
        paay_3D_settings["billingLine"] != null
          ? paay_3D_settings["billingLine"]
          : ahtml["billingAddress1"],
    },
    {
      name: "billingLine2",
      value: "",
    },
    {
      name: "billingLine3",
      value: "",
    },
    {
      name: "billingPostCode",
      value:
        paay_3D_settings["billingPostCode"] != null
          ? paay_3D_settings["billingPostCode"]
          : ahtml["billingZip"],
    },
    {
      name: "billingCity",
      value:
        paay_3D_settings["billingCity"] != null
          ? paay_3D_settings["billingCity"]
          : ahtml["billingCity"],
    },
    {
      name: "billingState",
      value: paay_3D_settings["billingState"] != null ? paay_3D_settings["billingState"] : ahtml["billingState"],
      condition:
        (paay_3D_settings["billingState"] != null &&
          paay_3D_settings["billingState"].trim().length >= 1 &&
          paay_3D_settings["billingState"].trim().length <= 3) ||
        (ahtml["billingState"] != undefined &&
          ahtml["billingState"].trim().length >= 1 &&
          ahtml["billingState"].trim().length <= 3),
    },
    {
        name:'billingCountry',
        value: paay_3D_settings['additionalBillingCountry'] != null ? paay_3D_settings['additionalBillingCountry'] : ahtml['billingCountry'],
        condition: (paay_3D_settings['additionalBillingCountry'] != null && paay_3D_settings['additionalBillingCountry'] != undefined) || ahtml['billingCountry'] != undefined                
    },
    {
      name: "addrMatch",
      value: paay_3D_settings["addrMatch"] != null ? paay_3D_settings["addrMatch"] : ahtml["addrMatch"],
    },
  ];
  otherCCPayload.some((data) => {
    if (data.condition === undefined || data.condition == true) {
      additionalHtml += `<input data-threeds="${data.name}" name="${data.name}" class="paay_additional_param" type="hidden" value="${data.value}">`;
    }
  });

  additionalHtml += `<input data-threeds="transType" name="transType" class="paay_additional_param" type="hidden" value="${paay_3D_settings["transType"] != null ? paay_3D_settings["transType"] : "1"}">`;
  additionalHtml += `<input data-threeds="email" name="email" class="paay_additional_param" type="hidden" value="${
    paay_3D_settings["email"] != null
      ? paay_3D_settings["email"]
      : ahtml["email"]
  }">`;

   if (typeof phone_codes === "string") {
     phone_codes = JSON.parse(phone_codes);
   }

   const shippingCountry = fData.find((x) => x.name === "shippingCountry",)?.value;

   const billingCountry = fData.find((x) => x.name === "billingCountry")?.value;

   additionalHtml += `<input data-threeds="mobileCC" name="mobileCC" class="paay_additional_param" type="hidden" value="${phone_codes[shippingCountry || billingCountry] || ""}">`;
   additionalHtml += `<input data-threeds="mobilePhoneNum" name="mobilePhoneNum" class="paay_additional_param" type="hidden" value="${
     paay_3D_settings["phone"] != null
       ? paay_3D_settings["phone"]
       : ahtml["phone"]
   }">`;

  return additionalHtml;
}
function setFormValues(type, response, status) {
  if (status == "success" && response.status == "Y") {

    if (type == "initial") {
        threeds_response.push({
            'type':type,
            'response':response,
            'status':response.status
        });
    } else {
        threeds_response.push({
            'type':type,
            'response':response,
            'status':response.status
        });
    }
  } else {

    threeds_response.push({
        'type':type,
        'response':response,
        'status':response.status
    });
  }
}
function callSubmit(done, notdone, formElement) {
    try{

          if(threeds_response.length>0){
            is_threeds_verified = true
            threeds_response.some(res_record => {
                storeLog(res_record, res_record.type, 'pay-call.js-response');
                if(res_record.status=='Y' || res_record.status=='A'){
                    if(res_record.type=='main'){
                        $("[name=cavv]").val(res_record.response.authenticationValue);
                        $("[name=eci]").val(res_record.response.eci);
                        $("[name=xid]").val(res_record.response.dsTransId);
                        $("[name=authenticationValue]").val(res_record.response.authenticationValue);
                        $("[name=dsTransactionId]").val(res_record.response.dsTransId);
                        $("[name=status]").val(res_record.response.status);
                        $("[name=protocolVersion]").val(res_record.response.protocolVersion);
                    }        
                    else if(res_record.type=='split_main'){
                        $("[name=split_cavv]").val(res_record.response.authenticationValue);
                        $("[name=split_eci]").val(res_record.response.eci);
                        $("[name=split_xid]").val(res_record.response.dsTransId);
                        $("[name=split_authenticationValue]").val(res_record.response.authenticationValue);
                        $("[name=split_dsTransactionId]").val(res_record.response.dsTransId);
                        $("[name=split_status]").val(res_record.response.status);
                        $("[name=split_protocolVersion]").val(res_record.response.protocolVersion);
                    }        
                    else{
                        $(`[name=${res_record.type}_cavv]`).val(res_record.response.authenticationValue);
                        $(`[name=${res_record.type}_eci]`).val(res_record.response.eci);
                        $(`[name=${res_record.type}_xid]`).val(res_record.response.dsTransId);
                        $(`[name=${res_record.type}_authenticationValue]`).val(res_record.response.authenticationValue);
                        $(`[name=${res_record.type}_dsTransactionId]`).val(res_record.response.dsTransId);
                        $(`[name=${res_record.type}_status]`).val(res_record.response.status);
                        $(`[name=${res_record.type}_protocolVersion]`).val(res_record.response.protocolVersion);
                    }    
                }
                else{
                  var cavv = document.querySelector('input[name="cavv"]');
                    if (res_record.type == "main") {
                        $("[name=status]").val(res_record.response.status);
                    } else {
                        $(`[name=${res_record.type}_status]`).val(res_record.response.status);
                    }
                    if(!cavv || !cavv.value){
                      is_process_started = false;
                      finallyReceived = false;
                      $(".paay_additional_param").remove();
                      cb.errorHandler([errMsg],formElement);
                      $('#loading-indicator').hide();
                      return notdone();
        
                    }
                }
            });
          } 
          storeLog(['Paay Params removed', threeds_response], 'main', 'pay-call.js-response');
          $(".paay_additional_param").remove();
          is_process_started = false;
          threeds_response = []
          return done();
    }
    catch( error) {
        console.error('Error during form submission:', error);
        storeLog(['Error during callSubmit', error], 'Main', 'pay-call.js-response');
      }
}

function storeLog(data, type='main', from='pay-call.js') {

  if(!paay_3D_settings['enable_logger']){
      return;
  }

  let urlParams = {
      data: JSON.stringify(data),
      type: type,
      from: from
    };
    const queryString = new URLSearchParams(urlParams).toString();

  fetch(app_config.offer_path + AJAX_PATH + 'extensions/paay_3dsv2/store-log?'+queryString, {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
        return response.text; // Parse the response as JSON
    })
    .then(data => {
    })
    .catch(error => {
    });
}