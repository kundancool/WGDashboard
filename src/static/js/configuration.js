// Config Toggle
$("body").on("click", ".switch", function (){
    $(this).siblings($(".spinner-border")).css("display", "inline-block");
     $(this).remove()
   location.replace("/switch/"+$(this).attr('id'));
})

// Generating Keys
function generate_key(){
    $.ajax({
        "url": "/generate_peer",
        "method": "GET",
    }).done(function(res){
        $("#private_key").val(res.private_key)
        $("#public_key").val(res.public_key)
        $("#preshared_key").val(res.preshared_key)
        $("#add_peer_alert").addClass("d-none");
        $("#re_generate_key i").removeClass("rotating")
    })
}
function generate_public_key(){
    $.ajax({
        "url": "/generate_public_key",
        "method": "POST",
        "headers":{"Content-Type": "application/json"},
        "data": JSON.stringify({"private_key": $("#private_key").val()})
    }).done(function(res){
        if(res['status'] === "failed"){
            $("#add_peer_alert").html(res['msg']);
            $("#add_peer_alert").removeClass("d-none");
        }else{
            $("#add_peer_alert").addClass("d-none");
        }
        $("#public_key").val(res['data'])
         $("#re_generate_key i").removeClass("rotating")
    })
}

// Add Peer
$("#private_key").change(function(){
    if ($("#private_key").val().length > 0){
        $("#re_generate_key i").addClass("rotating")
        generate_public_key()
    }else{
        $("#public_key").removeAttr("disabled")
        $("#public_key").val("")
    }
})
$('#add_modal').on('show.bs.modal', function (event) {
    generate_key()
})
$("#re_generate_key").click(function (){
    $("#public_key").attr("disabled","disabled")
    $("#re_generate_key i").addClass("rotating")
    generate_key()
})
$("#save_peer").click(function(){
    $(this).attr("disabled","disabled")
    $(this).html("Saving...")

    if ($("#allowed_ips").val() !== "" && $("#public_key").val() !== "" && $("#new_add_DNS").val() !== "" && $("#new_add_endpoint_allowed_ip").val() != ""){
        var conf = $(this).attr('conf_id')
        var data_list = [$("#private_key"), $("#allowed_ips"), $("#new_add_name"), $("#new_add_DNS"), $("#new_add_endpoint_allowed_ip"),$("#new_add_MTU"),$("#new_add_keep_alive")]
        for (var i = 0; i < data_list.length; i++){
            data_list[i].attr("disabled", "disabled")
        }
        $.ajax({
            method: "POST",
            url: "/add_peer/"+conf,
            headers:{
                "Content-Type": "application/json"
            },
            data: JSON.stringify({
                "private_key":$("#private_key").val(),
                "public_key":$("#public_key").val(),
                "preshared_key":$("#preshared_key").val(),
                "allowed_ips": $("#allowed_ips").val(),
                "name":$("#new_add_name").val(),
                "DNS": $("#new_add_DNS").val(),
                "endpoint_allowed_ip": $("#new_add_endpoint_allowed_ip").val(),
                "MTU": $("#new_add_MTU").val(),
                "keep_alive": $("#new_add_keep_alive").val()
            }),
            success: function (response){
                if(response != "true"){
                    $("#add_peer_alert").html(response);
                    $("#add_peer_alert").removeClass("d-none");
                    for (var i = 0; i < data_list.length; i++){
                        data_list[i].removeAttr("disabled", "disabled")
                    }
                    $("#save_peer").removeAttr("disabled")
                    $("#save_peer").html("Save")
                }
                else{
                    location.reload();
                }
            }
        })
    }else{
        $("#add_peer_alert").html("Please fill in all required box.");
        $("#add_peer_alert").removeClass("d-none");
        $(this).removeAttr("disabled")
        $(this).html("Save")
    }
})
var qrcodeModal = new bootstrap.Modal(document.getElementById('qrcode_modal'), {
    keyboard: false
})

// QR Code
$("body").on("click", ".btn-qrcode-peer", function (){
    qrcodeModal.toggle();
    $("#qrcode_img").attr('src', $(this).attr('img_src'))
})

// Delete Peer Modal
var deleteModal = new bootstrap.Modal(document.getElementById('delete_modal'), {
    keyboard: false
});

$("body").on("click", ".btn-delete-peer", function(){
    var peer_id = $(this).attr("id");
    $("#delete_peer").attr("peer_id", peer_id);
    deleteModal.toggle();
})

$("#delete_peer").click(function(){
    $(this).attr("disabled","disabled")
    $(this).html("Deleting...")
    var peer_id = $(this).attr("peer_id");
    var config = $(this).attr("conf_id");
    $.ajax({
        method: "POST",
        url: "/remove_peer/"+config,
        headers:{
            "Content-Type": "application/json"
        },
        data: JSON.stringify({"action": "delete", "peer_id": peer_id}),
        success: function (response){
            if(response !== "true"){
                $("#remove_peer_alert").html(response+$("#add_peer_alert").html());
                $("#remove_peer_alert").removeClass("d-none");
            }
            else{
                deleteModal.toggle();
                load_data($('#search_peer_textbox').val());
                $('#alertToast').toast('show');
                $('#alertToast .toast-body').html("Peer deleted!");
                $("#delete_peer").removeAttr("disabled")
                $("#delete_peer").html("Delete")
            }
        }
    })
});

// Peer Setting Modal
var settingModal = new bootstrap.Modal(document.getElementById('setting_modal'), {
    keyboard: false
})
$("body").on("click", ".btn-setting-peer", function(){
    startProgressBar()
    var peer_id = $(this).attr("id");
    $("#save_peer_setting").attr("peer_id", peer_id);
    $.ajax({
        method: "POST",
        url: "/get_peer_data/"+$("#setting_modal").attr("conf_id"),
        headers:{
            "Content-Type": "application/json"
        },
        data: JSON.stringify({"id": peer_id}),
        success: function(response){
            var peer_name = ((response['name'] === "") ? "Untitled Peer" : response['name'])
            $("#setting_modal .peer_name").html(peer_name);
            $("#setting_modal #peer_name_textbox").val(response['name'])
            $("#setting_modal #peer_private_key_textbox").val(response['private_key'])
            $("#setting_modal #peer_DNS_textbox").val(response['DNS'])
            $("#setting_modal #peer_allowed_ip_textbox").val(response['allowed_ip'])
            $("#setting_modal #peer_endpoint_allowed_ips").val(response['endpoint_allowed_ip'])
            $("#setting_modal #peer_mtu").val(response['mtu'])
            $("#setting_modal #peer_keep_alive").val(response['keep_alive'])
            settingModal.toggle();
            endProgressBar()
        }
    })
});

$('#setting_modal').on('hidden.bs.modal', function (event) {
  $("#setting_peer_alert").addClass("d-none");
})

$("#peer_private_key_textbox").change(function(){
    if ($(this).val().length > 0){
        $.ajax({
            "url": "/check_key_match/"+$("#save_peer_setting").attr("conf_id"),
            "method": "POST",
            "headers":{"Content-Type": "application/json"},
            "data": JSON.stringify({
                "private_key": $("#peer_private_key_textbox").val(),
                "public_key": $("#save_peer_setting").attr("peer_id")
            })
        }).done(function(res){
            if(res['status'] == "failed"){
                $("#setting_peer_alert").html(res['msg']);
                $("#setting_peer_alert").removeClass("d-none");
            }else{
                $("#setting_peer_alert").addClass("d-none");
            }
        })
    }
})

$("#save_peer_setting").click(function (){
    $(this).attr("disabled","disabled")
    $(this).html("Saving...")
    if ($("#peer_DNS_textbox").val() !== "" &&
        $("#peer_allowed_ip_textbox").val() !== "" &&
        $("#peer_endpoint_allowed_ips").val() != ""
    ){
        var peer_id = $(this).attr("peer_id");
        var conf_id = $(this).attr("conf_id");
        var data_list = [
            $("#peer_name_textbox"), $("#peer_DNS_textbox"), $("#peer_private_key_textbox"),
            $("#peer_allowed_ip_textbox"), $("#peer_endpoint_allowed_ips"), $("#peer_mtu"), $("#peer_keep_alive")
        ]
        for (var i = 0; i < data_list.length; i++){
            data_list[i].attr("disabled", "disabled")
        }
        $.ajax({
            method: "POST",
            url: "/save_peer_setting/"+conf_id,
            headers:{
                "Content-Type": "application/json"
            },
            data: JSON.stringify({
                id: peer_id,
                name: $("#peer_name_textbox").val(),
                DNS: $("#peer_DNS_textbox").val(),
                private_key: $("#peer_private_key_textbox").val(),
                allowed_ip: $("#peer_allowed_ip_textbox").val(),
                endpoint_allowed_ip: $("#peer_endpoint_allowed_ips").val(),
                MTU: $("#peer_mtu").val(),
                keep_alive: $("#peer_keep_alive").val()
            }),
            success: function (response){
                if (response['status'] === "failed"){
                    $("#setting_peer_alert").html(response['msg']);
                    $("#setting_peer_alert").removeClass("d-none");
                }else{
                    settingModal.toggle();
                    load_data($('#search_peer_textbox').val())
                    $('#alertToast').toast('show');
                    $('#alertToast .toast-body').html("Peer Saved!");
                }
                $("#save_peer_setting").removeAttr("disabled")
                $("#save_peer_setting").html("Save")
                for (var i = 0; i < data_list.length; i++){
                    data_list[i].removeAttr("disabled")
                }
            }
        })
        }else{
        $("#setting_peer_alert").html("Please fill in all required box.");
        $("#setting_peer_alert").removeClass("d-none");
        $("#save_peer_setting").removeAttr("disabled")
        $("#save_peer_setting").html("Save")
    }


})

$(".peer_private_key_textbox_switch").click(function (){
    let mode = (($("#peer_private_key_textbox").attr('type') === 'password') ? "text":"password")
    let icon = (($("#peer_private_key_textbox").attr('type') === 'password') ? "bi bi-eye-slash-fill":"bi bi-eye-fill")
    $("#peer_private_key_textbox").attr('type',mode)
    $(".peer_private_key_textbox_switch i").removeClass().addClass(icon)
})


// Search Peer
var typingTimer;
var doneTypingInterval = 200;
var $input = $('#search_peer_textbox');
$input.on('keyup', function () {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
});
$input.on('keydown', function () {
    clearTimeout(typingTimer);
});
function doneTyping () {
    load_data($('#search_peer_textbox').val());
}

// Sorting
$("body").on("change", "#sort_by_dropdown", function (){
    $.ajax({
        method:"POST",
        data: JSON.stringify({'sort':$("#sort_by_dropdown option:selected").val()}),
        headers:{"Content-Type": "application/json"},
        url: "/update_dashboard_sort",
        success: function (res){
            location.reload()
        }
    })
})

// Click key to copy
$("body").on("mouseenter", ".key", function(){
    var label = $(this).parent().siblings().children()[1]
    label.style.opacity = "100"
})
$("body").on("mouseout", ".key", function(){
    var label = $(this).parent().siblings().children()[1]
    label.style.opacity = "0"
    setTimeout(function (){
        label.innerHTML = "CLICK TO COPY"
    },200)

});
$("body").on("click", ".key", function(){
    var label = $(this).parent().siblings().children()[1]
    copyToClipboard($(this))
    label.innerHTML = "COPIED!"
})
function copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(element).text()).select();
    document.execCommand("copy");
    $temp.remove();
}

// Update Interval
$("body").on("click", ".update_interval", function(){
	    $.ajax({
            method:"POST",
            data: "interval="+$(this).attr("refresh-interval"),
            url: "/update_dashboard_refresh_interval",
            success: function (res){
                location.reload()
            }
        })
    });
$("body").on("click", ".refresh", function (){
    load_data($('#search_peer_textbox').val());
});

// Switch display mode
$("body").on("click", ".display_mode", function(){
    $.ajax({
        method:"GET",
        url: "/switch_display_mode/"+$(this).attr("display-mode"),
        success: function (res){
            location.reload()
        }
    })
})