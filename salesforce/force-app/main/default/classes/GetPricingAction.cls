public with sharing class GetPricingAction {

    public class Request {
        @InvocableVariable(
            label='Products'
            description='JSON array of products with quantities to price, e.g. [{"sku":"CHEM-008","quantity":10}]'
            required=true
        )
        public String products;
    }

    public class Result {
        @InvocableVariable(
            label='Priced Items'
            description='JSON array of priced items with unitPrice, lineTotal, and updated descriptions'
        )
        public String pricedItems;
    }

    @InvocableMethod(
        label='Get Pricing'
        description='Get current pricing and details for selected products from the MCP server'
        callout=true
    )
    public static List<Result> getPricing(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            try {
                String sessionId = initializeMcpSession();
                if (sessionId == null) {
                    r.pricedItems = '{"error": "Failed to initialize MCP session"}';
                    results.add(r);
                    continue;
                }

                List<Object> items = (List<Object>) JSON.deserializeUntyped(req.products);

                String mcpPayload = JSON.serialize(new Map<String, Object>{
                    'jsonrpc' => '2.0',
                    'id' => '3',
                    'method' => 'tools/call',
                    'params' => new Map<String, Object>{
                        'name' => 'calculate_quote',
                        'arguments' => new Map<String, Object>{
                            'customer_id' => 'default',
                            'items' => items
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
                    r.pricedItems = parseSseResponse(resp.getBody());
                } else {
                    r.pricedItems = '{"error": "MCP server returned status ' + resp.getStatusCode() + '"}';
                }
            } catch (Exception e) {
                r.pricedItems = '{"error": "' + e.getMessage().replace('"', '\\"') + '"}';
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
                        return (String) firstContent.get('text');
                    }
                }
                return jsonData;
            }
        }
        return body;
    }
}
