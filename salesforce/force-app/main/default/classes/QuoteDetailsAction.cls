public with sharing class QuoteDetailsAction {

    public class Request {
        @InvocableVariable(
            label='Quote ID'
            description='The Quote record ID'
            required=true
        )
        public String quoteId;
    }

    public class Result {
        @InvocableVariable(
            label='Quote Detail'
            description='Full quote details including products, amounts, and status'
        )
        public String quoteDetail;
    }

    @InvocableMethod(
        label='Get Quote Details'
        description='Gets detailed information about a specific quote'
    )
    public static List<Result> getQuoteDetails(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            Quote q = [
                SELECT Id, QuoteNumber, Name, Status, GrandTotal, Description,
                       CreatedDate, ExpirationDate, Opportunity.Account.Name
                FROM Quote
                WHERE Id = :req.quoteId
                WITH USER_MODE
                LIMIT 1
            ];
            Map<String, String> detail = new Map<String, String>();
            detail.put('Id', q.Id);
            detail.put('QuoteNumber', q.QuoteNumber);
            detail.put('Name', q.Name);
            detail.put('Status', q.Status != null ? q.Status : 'Draft');
            detail.put('GrandTotal', q.GrandTotal != null ? String.valueOf(q.GrandTotal) : '0');
            detail.put('Description', q.Description != null ? q.Description : '');
            detail.put('CreatedDate', String.valueOf(q.CreatedDate));
            detail.put('ExpirationDate', q.ExpirationDate != null ? String.valueOf(q.ExpirationDate) : '');
            detail.put('AccountName', q.Opportunity.Account.Name != null ? q.Opportunity.Account.Name : '');
            r.quoteDetail = JSON.serialize(detail);
            results.add(r);
        }
        return results;
    }
}
