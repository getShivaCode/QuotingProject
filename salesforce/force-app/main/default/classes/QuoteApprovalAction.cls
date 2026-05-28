public with sharing class QuoteApprovalAction {

    public class Request {
        @InvocableVariable(
            label='Quote ID'
            description='The Quote record ID to submit for approval'
            required=true
        )
        public String quoteId;

        @InvocableVariable(
            label='Comments'
            description='Comments for the approval request'
        )
        public String comments;
    }

    public class Result {
        @InvocableVariable(
            label='Approval Status'
            description='Status of the approval submission'
        )
        public String approvalStatus;
    }

    @InvocableMethod(
        label='Submit Quote for Approval'
        description='Submits a quote for approval via the standard approval process'
    )
    public static List<Result> submitForApproval(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            try {
                Approval.ProcessSubmitRequest approvalRequest = new Approval.ProcessSubmitRequest();
                approvalRequest.setObjectId(req.quoteId);
                if (String.isNotBlank(req.comments)) {
                    approvalRequest.setComments(req.comments);
                }
                Approval.ProcessResult approvalResult = Approval.process(approvalRequest);
                r.approvalStatus = approvalResult.isSuccess() ? 'Submitted Successfully' : 'Submission Failed: ' + approvalResult.getErrors()[0].getMessage();
            } catch (Exception e) {
                r.approvalStatus = 'Error: ' + e.getMessage();
            }
            results.add(r);
        }
        return results;
    }
}
