module.exports = {
    default: {
      require: ["./steps/**/*.ts"], // or your actual step folder
      requireModule: ["ts-node/register"],
      format: ["progress"],
      timeout: 120000,
    },
  };
  