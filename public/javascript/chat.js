const socket = window.io();

function scrollToBottom() {
  const messages = $('#message-list');
  const newMessage = messages.children('li:last-child');

  const clientHeight = messages.prop('clientHeight');
  const scrollTop = messages.prop('scrollTop');
  const scrollHeight = messages.prop('scrollHeight');
  const newMessageHeight = newMessage.innerHeight();
  const lastMessageHeight = newMessage.prev().innerHeight();

  if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight   >= scrollHeight) {
    messages.scrollTop(scrollHeight);
  }
};

socket.on('connect', () => {
  const params = $.deparam(window.location.search);
  socket.emit('join', params, function (err) {
    if (err) {
      alert(err);
      window.location.href = '/';
    } else {
      console.log('No error');
    }
  });
});

socket.on('updateUserList', users => {
  const ol = $('<ol></ol>');
  users.forEach(function (user) {
    ol.append($('<li></li>').text(user));
  });
  $('#users').html(ol);
});

socket.on('disconnect', () => {
  console.log('Connection failed');
});

socket.on('newMessage', data => {
  const template = $('#message-template').html();
  const formattedTime = moment(data.createdAt).format('h:mm a');
  const html = Mustache.render(template, {
    text: data.text,
    from: data.from,
    createdAt: formattedTime,
  });
  $('#message-list').append(html);
  scrollToBottom();
});

socket.on('newLocationMessage', data => {
  const template = $('#location-message-template').html();
  const formattedTime = moment(data.createdAt).format('h:mm a');
  const html = Mustache.render(template, {
    url: data.url,
    from: data.from,
    createdAt: formattedTime,
  });
  $('#message-list').append(html);
  scrollToBottom();
});

$('#message-form').on('submit', function (e) {
  e.preventDefault();
  const messageTextbox = $('input[name=message]');
  socket.emit('createMessage', {
    text: messageTextbox.val(),
  }, () => {
    messageTextbox.val('');
  });
});

const locationButton = $('#send-location');
locationButton.on('click', function () {
  if (!navigator.geolocation) {
    return alert('Geolocation not support in your browser.');
  }

  locationButton.attr('disabled', 'disabled').text('Sending location ...');

  navigator.geolocation.getCurrentPosition(function (position) {
    const coords = position.coords;
    locationButton.removeAttr('disabled').text('Send location');
    socket.emit('createLocationMessage', {
      latitude: coords.latitude,
      longitude: coords.longitude,
    }, () => {}); // It is a callback function, which we could will run on server side
  }, function () {
    locationButton.removeAttr('disabled').text('Send location');
    alert('Unable to fetch location data ');
  });
});
