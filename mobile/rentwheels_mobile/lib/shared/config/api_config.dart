const apiGatewayUrl = String.fromEnvironment(
  'API_GATEWAY_URL',
  defaultValue:
      'https://bus-service.politebay-268e19e8.eastus.azurecontainerapps.io',
);

const clienteApiBaseUrl =
    '$apiGatewayUrl/api/v1/gustavobenalcazar/cliente';

const graphqlUrl = '$apiGatewayUrl/graphql';
