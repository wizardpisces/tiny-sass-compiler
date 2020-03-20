/**
 * test @extend
 */
module.exports = scss = `
.message-shared {
    border: 1px solid #ccc;
    padding: 10px;
    color: #333;
}

%message-shared {
  border: 1px solid #ccc;
  padding: 10px;
  color: #333;
}

.message {
    @extend .message-shared;
}

.success {
    @extend .message-shared;
    border-color: green;
}
.error{
    color:red;
    @extend %message-shared
}
`;