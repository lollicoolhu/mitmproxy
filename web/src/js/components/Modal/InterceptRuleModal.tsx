import * as React from "react";
import { useAppDispatch, useAppSelector } from "../../ducks";
import * as modalAction from "../../ducks/ui/modal";
import { saveRule, checkDuplicate } from "../../ducks/ui/intercept";
import InterceptRuleEditor from "../InterceptConfig/InterceptRuleEditor";

export default function InterceptRuleModal() {
    const dispatch = useAppDispatch();
    const activeRule = useAppSelector((state) => state.ui.intercept.activeRule);

    if (!activeRule) return null;

    const onSave = async () => {
        const duplicate = await checkDuplicate(activeRule);
        if (duplicate && duplicate.id !== activeRule.id) {
            if (!confirm("A rule with the same Method, Path, and Query already exists. Overwrite it?")) {
                return;
            }
            // Use the duplicate ID to overwrite
            const ruleToSave = { ...activeRule, id: duplicate.id };
            dispatch(saveRule(ruleToSave));
        } else {
            dispatch(saveRule(activeRule));
        }
        dispatch(modalAction.hideModal());
    };

    return (
        <div className="intercept-rule-modal" key={activeRule.id}>
            <div className="modal-header">
                <button
                    type="button"
                    className="close"
                    data-dismiss="modal"
                    onClick={() => dispatch(modalAction.hideModal())}
                >
                    &times;
                </button>
                <div className="modal-title">Create Intercept Rule</div>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <InterceptRuleEditor rule={activeRule} />
            </div>
            <div className="modal-footer">
                <button className="btn btn-primary" onClick={onSave}>Save</button>
            </div>
        </div>
    );
}
