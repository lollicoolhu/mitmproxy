import * as React from "react";
import ModalLayout from "./ModalLayout";
import OptionContent from "./OptionModal";
import InterceptRuleContent from "./InterceptRuleModal";
import ImportConfirmContent from "./ImportConfirmModal";

function OptionModal() {
    return (
        <ModalLayout>
            <OptionContent />
        </ModalLayout>
    );
}

function InterceptRuleModal() {
    return (
        <ModalLayout>
            <InterceptRuleContent />
        </ModalLayout>
    );
}

function ImportConfirmModal() {
    return (
        <ModalLayout>
            <ImportConfirmContent />
        </ModalLayout>
    );
}

export default {
    OptionModal,
    InterceptRuleModal,
    ImportConfirmModal,
};
