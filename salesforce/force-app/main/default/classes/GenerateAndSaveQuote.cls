public with sharing class GenerateAndSaveQuote {

    public class Request {
        @InvocableVariable(
            label='Products'
            description='JSON array of selected products with quantities'
            required=true
        )
        public String products;

        @InvocableVariable(
            label='Account ID'
            description='The Salesforce Account ID'
            required=true
        )
        public String accountId;

        @InvocableVariable(
            label='Quote Name'
            description='Name for the quote record'
            required=true
        )
        public String quoteName;
    }

    public class Result {
        @InvocableVariable(
            label='Quote Details'
            description='Formatted quote with product descriptions, quantities, unit prices, and grand total'
        )
        public String quoteDetails;

        @InvocableVariable(
            label='Quote ID'
            description='The ID of the created Quote record'
        )
        public String quoteId;

        @InvocableVariable(
            label='Quote Number'
            description='The quote number assigned by Salesforce'
        )
        public String quoteNumber;
    }

    @InvocableMethod(
        label='Generate and Save Quote'
        description='Generates a priced quote from the MCP server and saves it to Salesforce'
        callout=true
    )
    public static List<Result> generateAndSave(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            try {
                // Step 1: Call MCP to get pricing
                String quoteJson = callMcpForQuote(req.products);

                // Step 2: Parse the response
                Decimal grandTotal = 0;
                String description = '';
                Map<String, Object> quoteData = (Map<String, Object>) JSON.deserializeUntyped(quoteJson);

                if (quoteData.containsKey('grand_total')) {
                    grandTotal = (Decimal) quoteData.get('grand_total');
                }
                if (quoteData.containsKey('breakdown')) {
                    List<Object> breakdown = (List<Object>) quoteData.get('breakdown');
                    List<String> lines = new List<String>();
                    for (Object item : breakdown) {
                        Map<String, Object> prod = (Map<String, Object>) item;
                        String name = (String) prod.get('name');
                        String sku = (String) prod.get('sku');
                        Decimal unitPrice = prod.containsKey('unit_price') ? (Decimal) prod.get('unit_price') : 0;
                        Decimal subtotal = prod.containsKey('subtotal') ? (Decimal) prod.get('subtotal') : 0;
                        lines.add(name + ' (' + sku + ') - Unit Price: $' + unitPrice + ', Subtotal: $' + subtotal);
                    }
                    description = String.join(lines, '\n') + '\n\nGrand Total: $' + grandTotal;
                } else {
                    description = quoteJson;
                }

                // Step 3: Create Opportunity
                Opportunity opp = new Opportunity();
                opp.Name = req.quoteName;
                opp.AccountId = req.accountId;
                opp.StageName = 'Prospecting';
                opp.CloseDate = Date.today().addDays(30);
                opp.Amount = grandTotal;
                opp.Pricebook2Id = '01sfj000007sHPdAAM';
                insert opp;

                // Step 4: Create Quote
                Quote q = new Quote();
                q.Name = req.quoteName;
                q.OpportunityId = opp.Id;
                q.Description = description;
                q.Pricebook2Id = '01sfj000007sHPdAAM';
                insert q;

                // Step 5: Create QuoteLineItem for GrandTotal
                QuoteLineItem qli = new QuoteLineItem();
                qli.QuoteId = q.Id;
                qli.PricebookEntryId = '01ufj0000038BbnAAE';
                qli.Quantity = 1;
                qli.UnitPrice = grandTotal;
                qli.Description = description;
                insert qli;

                // Step 6: Get QuoteNumber
                Quote savedQuote = [SELECT Id, QuoteNumber FROM Quote WHERE Id = :q.Id LIMIT 1];
                r.quoteId = savedQuote.Id;
                r.quoteNumber = savedQuote.QuoteNumber;
                r.quoteDetails = quoteJson;
            } catch (Exception e) {
                r.quoteDetails = '{"error": "' + e.getMessage().replace('"', '\\"') + '"}';
                r.quoteId = '';
                r.quoteNumber = '';
            }
            results.add(r);
        }
        return results;
    }

    private static String callMcpForQuote(String products) {
        String sessionId = initializeMcpSession();
        if (sessionId == null) {
            return '{"error": "Failed to initialize MCP session"}';
        }

        List<Object> items = (List<Object>) JSON.deserializeUntyped(products);

        String mcpPayload = JSON.serialize(new Map<String, Object>{
            'jsonrpc' => '2.0',
            'id' => '2',
            'method' => 'tools/call',
            'params' => new Map<String, Object>{
                'name' => 'calculate_quote',
                'arguments' => new Map<String, Object>{
                    'customer_id' => 'salesforce_agent',
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
            return parseSseResponse(resp.getBody());
        }
        return '{"error": "MCP server returned status ' + resp.getStatusCode() + '"}';
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
            String sid = resp.getHeader('Mcp-Session-Id');
            if (sid == null) {
                sid = resp.getHeader('mcp-session-id');
            }
            return sid;
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
