import createSpinner from 'yocto-spinner'

let spinnerInstance: ReturnType<typeof createSpinner> | null = null

export function startSpinner(text = 'Loading...'): void {
    if (spinnerInstance) {
        spinnerInstance.stop()
    }
    spinnerInstance = createSpinner({ text, color: 'blue' })
    spinnerInstance.start()
}

export function stopSpinner(): void {
    if (spinnerInstance) {
        spinnerInstance.stop()
        spinnerInstance = null
    }
}

export function succeedSpinner(text?: string): void {
    console.log(text || 'Done')
    stopSpinner()
}

export function failSpinner(text?: string): void {
    console.error(text || 'Failed')
    stopSpinner()
}