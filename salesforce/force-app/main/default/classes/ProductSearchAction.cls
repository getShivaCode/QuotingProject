public with sharing class ProductSearchAction {

    public class Request {
        @InvocableVariable(
            label='Query'
            description='Semantic search query to find products'
            required=true
        )
        public String query;
    }

    public class Result {
        @InvocableVariable(
            label='Results'
            description='JSON string of matching products with names, descriptions, and pricing'
        )
        public String results;
    }

    @InvocableMethod(
        label='Search Products'
        description='Searches for products using semantic search on the external pricing MCP server'
        callout=true
    )
    public static List<Result> searchProducts(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            try {
                String sessionId = initializeMcpSession();
                if (sessionId == null) {
                    r.results = '{"error": "Failed to initialize MCP session"}';
                    results.add(r);
                    continue;
                }

                String mcpPayload = JSON.serialize(new Map<String, Object>{
                    'jsonrpc' => '2.0',
                    'id' => '2',
                    'method' => 'tools/call',
                    'params' => new Map<String, Object>{
                        'name' => 'search_products',
                        'arguments' => new Map<String, Object>{
                            'query' => req.query
                        }
                    }
                });

                HttpRequest httpReq = new HttpRequest();
                httpReq.setEndpoint('https://pricingmcp.onrender.com/mcp');
                httpReq.setMethod('POST');
                httpReq.setHeader('Content-Type', 'application/json');
                httpReq.setHeader('Accept', 'application/json, text/event-stream');
                httpReq.setHeader('Mcp-Session-Id', sessionId);
                httpReq.setTimeout(30000);
                httpReq.setBody(mcpPayload);

                Http http = new Http();
                HttpResponse resp = http.send(httpReq);

                if (resp.getStatusCode() == 200) {
                    r.results = parseSseResponse(resp.getBody());
                } else {
                    r.results = '{"error": "MCP server returned status ' + resp.getStatusCode() + '"}';
                }
            } catch (Exception e) {
                r.results = '{"error": "' + e.getMessage().replace('"', '\\"') + '"}';
            }
            results.add(r);
        }
        return results;
    }

    private static String initializeMcpSession() {
        String initPayload = JSON.serialize(new Map<String, Object>{
            'jsonrpc' => '2.0',
            'id' => '1',
            'method' => 'initialize',
            'params' => new Map<String, Object>{
                'protocolVersion' => '2024-11-05',
                'capabilities' => new Map<String, Object>(),
                'clientInfo' => new Map<String, Object>{
                    'name' => 'SalesforceAgent',
                    'version' => '1.0'
                }
            }
        });

        HttpRequest httpReq = new HttpRequest();
        httpReq.setEndpoint('https://pricingmcp.onrender.com/mcp');
        httpReq.setMethod('POST');
        httpReq.setHeader('Content-Type', 'application/json');
        httpReq.setHeader('Accept', 'application/json, text/event-stream');
        httpReq.setTimeout(30000);
        httpReq.setBody(initPayload);

        Http http = new Http();
        HttpResponse resp = http.send(httpReq);

        if (resp.getStatusCode() == 200) {
            String sessionId = resp.getHeader('Mcp-Session-Id');
            if (sessionId == null) {
                sessionId = resp.getHeader('mcp-session-id');
            }
            return sessionId;
        }
        return null;
    }

    private static String parseSseResponse(String body) {
        if (body == null || body == '') {
            return '{"error": "Empty response"}';
        }
        for (String line : body.split('\n')) {
            if (line.startsWith('data: ')) {
                String jsonData = line.substring(6).trim();
                Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(jsonData);
                Object resultObj = parsed.get('result');
                if (resultObj != null) {
                    Map<String, Object> resultMap = (Map<String, Object>) resultObj;
                    List<Object> content = (List<Object>) resultMap.get('content');
                    if (content != null && !content.isEmpty()) {
                        Map<String, Object> firstContent = (Map<String, Object>) content[0];
                        String textStr = (String) firstContent.get('text');
                        return filterByRelevance(textStr);
                    }
                }
                return jsonData;
            }
        }
        return body;
    }

    private static String filterByRelevance(String jsonText) {
        if (jsonText == null || jsonText == '') {
            return jsonText;
        }
        try {
            List<Object> products = (List<Object>) JSON.deserializeUntyped(jsonText);
            List<Object> filtered = new List<Object>();

            for (Object item : products) {
                Map<String, Object> product = (Map<String, Object>) item;
                Decimal score = (Decimal) product.get('score');
                if (score != null && score >= 0.70) {
                    filtered.add(product);
                }
            }

            return filtered.isEmpty()
                ? '{"error": "No products found matching your search criteria"}'
                : JSON.serialize(filtered);
        } catch (Exception e) {
            return jsonText;
        }
    }
}
