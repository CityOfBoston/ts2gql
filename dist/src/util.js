"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var doctrine = require("doctrine");
var typescript = require("typescript");
function documentationForNode(node, source) {
    source = source || node.getSourceFile().text;
    var commentRanges = typescript.getLeadingCommentRanges(source, node.getFullStart());
    if (!commentRanges)
        return undefined;
    // We only care about the closest comment to the node.
    var lastRange = _.last(commentRanges);
    if (!lastRange)
        return undefined;
    var comment = source.substr(lastRange.pos, lastRange.end - lastRange.pos).trim();
    return doctrine.parse(comment, { unwrap: true });
}
exports.documentationForNode = documentationForNode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMEJBQTRCO0FBQzVCLG1DQUFxQztBQUNyQyx1Q0FBeUM7QUFFekMsU0FBZ0Isb0JBQW9CLENBQUMsSUFBb0IsRUFBRSxNQUFjO0lBQ3ZFLE1BQU0sR0FBRyxNQUFNLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLElBQUksQ0FBQztJQUM3QyxJQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsdUJBQXVCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQ3RGLElBQUksQ0FBQyxhQUFhO1FBQUUsT0FBTyxTQUFTLENBQUM7SUFDckMsc0RBQXNEO0lBQ3RELElBQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDeEMsSUFBSSxDQUFDLFNBQVM7UUFBRSxPQUFPLFNBQVMsQ0FBQztJQUNqQyxJQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLEdBQUcsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFFbkYsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQ2pELENBQUM7QUFWRCxvREFVQyJ9