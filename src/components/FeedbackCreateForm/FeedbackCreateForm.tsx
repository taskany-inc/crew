import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, FormActions, FormAction, FormTextarea, FormInput, ModalContent } from '@taskany/bricks';
import * as Sentry from '@sentry/nextjs';

import { errorsProvider } from '../../utils/forms';
import { CreateFeedback, createFeedbackSchema } from '../../modules/feedbackSchemas';
import { trpc } from '../../trpc/trpcClient';
import { notifyPromise } from '../../utils/notifications/notifyPromise';

import { tr } from './FeedbackCreateForm.i18n';

interface FeedbackCreateFormProps {
    onClose: () => void;
}

const FeedbackCreateForm = ({ onClose }: FeedbackCreateFormProps) => {
    const [formBusy, setFormBusy] = useState(false);
    const createMutation = trpc.feedback.create.useMutation();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitted },
    } = useForm<CreateFeedback>({
        resolver: zodResolver(createFeedbackSchema),
    });

    const errorsResolver = errorsProvider(errors, isSubmitted);

    const onPending = useCallback(
        async (form: CreateFeedback) => {
            setFormBusy(true);

            const result = await notifyPromise(
                createMutation.mutateAsync({
                    title: form.title,
                    description: form.description,
                    href: window.location.href,
                }),
                'sendFeedback',
            );

            if (result) {
                onClose();
            }

            setFormBusy(false);
        },
        [createMutation, onClose],
    );

    const onError = useCallback((err: typeof errors) => {
        Sentry.captureException(err);
    }, []);

    return (
        <ModalContent>
            <Form disabled={formBusy} onSubmit={handleSubmit(onPending, onError)}>
                <FormInput
                    {...register('title')}
                    placeholder={tr('Feedback title')}
                    flat="bottom"
                    brick="right"
                    error={errorsResolver('title')}
                />

                <FormTextarea
                    {...register('description')}
                    minHeight={100}
                    placeholder={tr("Feedback description. Say anything what's on your mind")}
                    flat="both"
                    error={errorsResolver('description')}
                />

                <FormActions flat="top">
                    <FormAction left inline />
                    <FormAction right inline>
                        <Button outline text={tr('Cancel')} onClick={onClose} />
                        <Button view="primary" outline type="submit" text={tr('Send feedback')} />
                    </FormAction>
                </FormActions>
            </Form>
        </ModalContent>
    );
};

export default FeedbackCreateForm;
