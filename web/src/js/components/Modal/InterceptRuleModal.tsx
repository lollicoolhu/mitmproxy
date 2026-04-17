import * as React from "react";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../ducks";
import * as modalAction from "../../ducks/ui/modal";
import { saveRule, checkDuplicate } from "../../ducks/ui/intercept";
import InterceptRuleEditor from "../InterceptConfig/InterceptRuleEditor";

export default function InterceptRuleModal() {
    const dispatch = useAppDispatch();
    const activeRule = useAppSelector((state) => state.ui.intercept.activeRule);
    const [error, setError] = useState<string | null>(null);

    if (!activeRule) return null;

    const onSave = async () => {
        setError(null);
        const duplicate = await checkDuplicate(activeRule);
        if (duplicate && duplicate.id !== activeRule.id) {
            setError("A rule with the same Method and Path already exists.");
            return;
        }
        dispatch(saveRule(activeRule));
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
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                {error && (
                    <span style={{ color: '#d9534f', fontSize: '12px', fontWeight: 'bold' }}>
                        <i className="fa fa-exclamation-triangle mr-1" />
                        {error}
                    </span>
                )}
                <button className="btn btn-primary" onClick={onSave}>Save</button>
            </div>
        </div>
    );
}
